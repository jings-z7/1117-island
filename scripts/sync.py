#!/usr/bin/env python3
"""Downloads the official department data into data/official.json and checks the site data against it.

Only two official sites are trusted (see SOURCES):
  - Faculty:     https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw   (餐旅學院・旅館管理系專任(案)教師)
  - Department:  https://hotel.nkuht.edu.tw/?Lang=zh-tw                   (旅館管理系官網，含其選單下的各子頁)

Usage:
  python scripts/sync.py              download, write data/official.json if it changed, verify the site data
  python scripts/sync.py --check      download and compare only; exit 10 if the official data changed
  python scripts/sync.py --verify     verify the site data against the committed data/official.json (offline)
  --no-stamp                          don't touch data/sync.json

Stability rules:
  - data/official.json only changes when the official content changes (timestamps live in data/sync.json).
  - Nothing is written when a page fails to download or parses to fewer records than expected;
    the previous file stays in place and the script exits non-zero.
  - Output is deterministic (fixed key order, official page order), so `git diff data/` shows real changes only.
  - PDF documents (畢業條件、課程標準、菁英實習 3.0) need the optional `pypdf`; without it their previous text is kept.
"""
import hashlib
import html
import io
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
OFFICIAL = ROOT / "data/official.json"
SYNC = ROOT / "data/sync.json"
POLICIES = [ROOT / "data/policies.json", ROOT / "policies.json"]
PEOPLE = ROOT / "people.js"
CORRECTIONS = ROOT / "data/corrections.json"
MODULE = ROOT / "official-data.js"
RESEARCH = ROOT / "data/research.json"  # GRB projects + top-2% lists (scripts/research_grb.mjs, scripts/research_top2.py)

FACULTY_URL = "https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw"
DEPT_URL = "https://hotel.nkuht.edu.tw/?Lang=zh-tw"
DEPT_BASE = "https://hotel.nkuht.edu.tw/"
SOURCES = {"faculty": FACULTY_URL, "department": DEPT_URL}

# Department sub-pages, found by their menu label on the department home page (URLs are not hard-coded,
# so a re-organised menu is followed automatically). (menu group, label) → key in official.json.
DEPT_PAGES = {
    ("系所簡介", "本系介紹"): "intro",
    ("系所簡介", "教育理念"): "philosophy",
    ("系所簡介", "行政與系務"): "administration",
    ("本系成員", "師資介紹"): "facultyDept",
    ("本系成員", "行政人員"): "staff",
    ("課程資訊", "課程標準表"): "curriculum",
    ("課程資訊", "畢業條件標準表"): "graduation",
    ("課程資訊", "課程地圖"): "curriculumMap",
    ("群賢會館", "相關法規"): "eliteHouseRegulations",
    ("本系規章", "相關法規"): "regulations",
    ("菁英實習合作機構", "按地理位置區分"): "partnersByRegion",
    ("菁英實習合作機構", "按集團品牌區分"): "partnersByBrand",
    ("菁英實習合作機構", "校外實習分發相關資料"): "internshipNotices",
}
# The partner page lists one table per region, in this order.
PARTNER_REGIONS = ["北部", "中部", "南部", "東部"]
# PDF documents worth keeping as text, picked by title from the list pages (newest first on the site).
DOCUMENTS = {
    "graduationLatest": ("graduation", r"旅館管理系畢業條件標準表\("),
    "eliteInternship": ("regulations", r"旅館菁英實習計畫3\.0實施方式"),
    "internshipCommittee": ("regulations", r"校外實習輔導小組設置要點"),
}
# Other units on the college faculty site: 餐旅管理研究所、餐飲管理系、餐旅暨會展行銷管理系、退休教師
OTHER_FACULTY_PAGES = ["853", "855", "856", "1728"]
# Names that were invented or belong to no official HTL page and must never return
NEVER_NAMES = ["謝佩伶", "吳繼文", "蘇昭月", "林美吟", "王聰榮", "蔡毓峯", "蔡博任", "吳欣庭", "張慧瑛"]
MIN_COUNTS = {"faculty": 5, "staff": 1, "partners": 10, "curriculum": 3, "regulations": 3}

UA = "Mozilla/5.0 (compatible; HTL-Island-Navigator-sync/1.0; +https://nkuht-htl.drmjhsu.com/)"


class SyncError(Exception):
    pass


# ---------------------------------------------------------------- fetching

def fetch(url, binary=False, tries=3):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                raw = r.read()
            return raw if binary else raw.decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise SyncError(f"download failed: {url} ({last})")


# ---------------------------------------------------------------- html helpers

def strip_tags(s):
    s = re.sub(r"<(script|style)\b.*?</\1>", "", s, flags=re.S | re.I)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</(p|div|li|tr|h\d|td|th)>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\xa0", " ").replace("\u3000", " ")
    return s


def clean(s):
    return re.sub(r"[ \t\r]+", " ", strip_tags(s)).strip()


def lines(s):
    return [ln.strip() for ln in re.sub(r"[ \t\r]+", " ", strip_tags(s)).split("\n") if ln.strip()]


def main_html(page):
    """The page body without header menu and footer (Rulingcom CMS layout)."""
    m = re.search(r'<main id="main-content">(.*?)</main>', page, re.S)
    body = m.group(1) if m else page
    body = re.sub(r'<ol class="breadcrumb">.*?</ol>', "", body, flags=re.S)
    body = re.sub(r'<div class="module module-misc">.*', "", body, flags=re.S)  # 瀏覽數 / print links
    return body


def links(fragment, base):
    out = []
    for m in re.finditer(r'<a\b([^>]*)>(.*?)</a>', fragment, re.S | re.I):
        attrs, inner = m.group(1), m.group(2)
        href = re.search(r'href="([^"]*)"', attrs)
        title = re.search(r'title="([^"]*)"', attrs)
        if not href:
            continue
        out.append({
            "href": urljoin(base, html.unescape(href.group(1)).strip()),
            "text": clean(inner),
            "title": html.unescape(title.group(1)).strip() if title else "",
        })
    return out


def canonical_url(u):
    """Drops tracking parameters so partner links don't churn."""
    u = re.sub(r"[?&](gad_source|gad_campaignid|gbraid|gclid|mktgvar|cm_mmc|srb_u|_ga)=[^&]*", "", u)
    return re.sub(r"\?&", "?", u).rstrip("?&")


# ---------------------------------------------------------------- department home

def parse_menu(page):
    """Top menu of hotel.nkuht.edu.tw → {(group, label): url}, in order."""
    nav = page.split('class="mn_header_menu', 1)[-1]
    nav = nav.split('<main id="main-content">', 1)[0]
    menu, group, order = {}, None, []
    for a in links(nav, DEPT_BASE):
        label = a["text"]
        if not label:
            continue
        if a["href"].startswith("javascript:"):
            group = label
            continue
        if group and (group, label) not in menu:
            menu[(group, label)] = a["href"]
            order.append({"group": group, "label": label, "url": a["href"]})
    return menu, order


def parse_footer(page):
    foot = page.split("版權所有", 1)[-1]
    text = clean(foot)
    addr = re.search(r"地址：\s*([^\n電]+?)\s*(?=電話|$)", text)
    tel = re.search(r"電話：\s*(.+?)\s*(?=傳真|$)", text)
    fax = re.search(r"傳真：\s*([\d\-]+)", text)
    if not (addr and tel):
        raise SyncError("department footer: address/phone not found")
    return {"address": addr.group(1).strip(), "phone": tel.group(1).strip(), "fax": fax.group(1) if fax else None}


def parse_activities(page):
    seen, out = set(), []
    for a in links(main_html(page), DEPT_BASE):
        if re.search(r"/p/132-1018-\d+", a["href"]) and a["text"] and a["href"] not in seen:
            seen.add(a["href"])
            out.append({"title": a["text"], "url": a["href"]})
    return out


# ---------------------------------------------------------------- text pages

def parse_sections(page):
    """本系介紹 / 教育理念 / 行政與系務: short lines are headings, the rest is their text."""
    body = main_html(page)
    m = re.search(r'<div class="mpgdetail">(.*)', body, re.S)
    ls = lines(m.group(1) if m else body)
    sections, cur = [], None
    for ln in ls:
        if ln in ("English", "繁體"):
            continue
        is_heading = len(ln) <= 8 and not re.search(r"[。，、；：:]$", ln)
        if is_heading:
            cur = {"heading": ln, "text": []}
            sections.append(cur)
        else:
            if cur is None:
                cur = {"heading": "", "text": []}
                sections.append(cur)
            cur["text"].append(ln)
    return sections


def parse_doc_list(page, base=DEPT_BASE):
    """List pages (畢業條件、課程地圖、法規): [{title, url}] in site order."""
    out, seen = [], set()
    for a in links(main_html(page), base):
        if re.search(r"/p/(406|450)-\d+-\d+", a["href"]) and a["text"] and a["href"] not in seen:
            seen.add(a["href"])
            out.append({"title": a["text"], "url": a["href"]})
    return out


# ---------------------------------------------------------------- faculty

LABELS = {
    "職稱": "title", "辦公室電話": "phone", "Email": "email", "E-mail": "email", "專長": "specialties",
    "專案": "specialties",  # 游明鳳 的條目在官網誤植為「專案：」，內容是專長
    "授課領域": "courses", "學歷": "education", "類別": "category", "研究專長": "specialties", "傳真": "fax",
    "姓名": "name",
}


def split_list(v):
    return [x.strip() for x in re.split(r"\s*[、,，]\s*", v) if x.strip()]


def split_ext(v):
    v = re.sub(r"^.*?(#|轉)", "", v)  # drop "07-806-0505" prefix
    return [x for x in re.split(r"[^\d]+", v) if x]


def normalize_person(fields):
    out = {}
    for k, v in fields.items():
        key = LABELS.get(k)
        if not key or not v:
            continue
        if key == "specialties" or key == "courses":
            out[key] = split_list(v) if re.search(r"[\u4e00-\u9fff]", v) else [x.strip() for x in v.split(",") if x.strip()]
        elif key == "phone":
            out["ext"] = split_ext(v)
        else:
            out[key] = v.strip()
    return out


def parse_faculty_list(page):
    out = []
    for block in re.split(r'<div class="d-item', main_html(page))[1:]:
        a = re.search(r'<div class="mtitle">.*?<a href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
        if not a:
            continue
        img = re.search(r'<img src="([^"]+)"', block)
        ed = re.search(r'<div class="meditor">(.*?)</div>', block, re.S)
        fields = {}
        for ln in lines(ed.group(1) if ed else ""):
            m = re.match(r"([^：:]{1,6})\s*[：:]\s*(.*)", ln)
            if m:
                fields[m.group(1).strip()] = m.group(2).strip()
        person = {"name": clean(a.group(2)).replace(" ", ""), "profileUrl": html.unescape(a.group(1))}
        person.update(normalize_person(fields))
        person["photo"] = urljoin(FACULTY_URL, img.group(1)) if img else None
        out.append(person)
    return out


def parse_profile(page):
    fields = {}
    for m in re.finditer(r'<span class="mattr-name">(.*?)</span>\s*<span class="mattr-val">(.*?)</span>', page, re.S):
        fields[clean(m.group(1)).rstrip(":： ")] = clean(m.group(2))
    title = re.search(r'<h2 class="hdline">(.*?)</h2>', page, re.S)
    out = normalize_person(fields)
    out["heading"] = clean(title.group(1)) if title else ""
    return out


def parse_dept_faculty(page):
    out = []
    for a in links(main_html(page), DEPT_BASE):
        if re.search(r"/p/405-1018-\d+,c\d+", a["href"]) and a["text"]:
            out.append({"heading": a["text"], "url": a["href"]})
    return out


# ---------------------------------------------------------------- staff

def parse_staff(page):
    body = main_html(page)
    rows = re.findall(r"<tr\b.*?</tr>", body, re.S)
    out = []
    for row in rows[1:]:
        cells = [lines(c) for c in re.findall(r"<td\b.*?</td>", row, re.S)]
        if len(cells) < 3:
            continue
        role, info, duties = " ".join(cells[0]), cells[1], cells[2]
        text = " ".join(info)
        name = next((x for x in info if re.fullmatch(r"[\u4e00-\u9fff]{2,4}", x)), None)
        ext = re.search(r"分機\s*(\d+)", text)
        email = re.search(r"[\w.\-]+@[\w.\-]+", text)
        deputy = re.search(r"職務代理人\s*([\u4e00-\u9fff]{2,4})", text)
        if name and deputy and name == deputy.group(1):
            name = None
        out.append({
            "role": role, "name": name, "ext": ext.group(1) if ext else None,
            "email": email.group(0) if email else None, "deputy": deputy.group(1) if deputy else None,
            "duties": duties,
        })
    return out


# ---------------------------------------------------------------- curriculum

def parse_curriculum(page):
    body = main_html(page)
    tables = []
    prev_end = 0
    for m in re.finditer(r"<table\b.*?</table>", body, re.S):
        rows = re.findall(r"<tr\b.*?</tr>", m.group(0), re.S)
        # the caption (e.g. 「大陸地區學生適用課程標準表」) is the text just before the table
        caption = [ln for ln in lines(body[prev_end:m.start()]) if "課程標準表" in ln]
        prev_end = m.end()
        if not rows:
            continue
        head = [clean(c) for c in re.findall(r"<t[dh]\b.*?</t[dh]>", rows[0], re.S)]
        label = re.sub(r"\s+", "", caption[-1]) if caption else (re.sub(r"\s+", "", head[0]) if head else "")
        columns = [re.sub(r"\s+", "", h) for h in head[1:]]
        entries = []
        for row in rows[1:]:
            cells = re.findall(r"<t[dh]\b.*?</t[dh]>", row, re.S)
            if not cells:
                continue
            first = links(cells[0], DEPT_BASE)
            vals = [clean(c) for c in cells]
            entry = {"label": re.sub(r"\s+", " ", vals[0]), "pdf": first[-1]["href"] if first else None}
            for col, v in zip(columns, vals[1:]):
                entry[col] = v
            entries.append(entry)
        if entries:
            tables.append({"program": label, "columns": columns, "rows": entries})
    return tables


# ---------------------------------------------------------------- partners

def parse_partners(page):
    body = main_html(page)
    published = re.search(r"發佈日期\s*:?\s*</?[^>]*>?\s*(\d{4}-\d{2}-\d{2})", body) or re.search(r"(\d{4}-\d{2}-\d{2})", body)
    tables = re.findall(r"<table\b.*?</table>", body, re.S)
    partners = []
    regions_ok = len(tables) == len(PARTNER_REGIONS)
    for ti, t in enumerate(tables):
        for a in links(t, DEPT_BASE):
            name = a["title"] or a["text"]
            if not name:
                continue
            partners.append({
                "name": name.strip(),
                "region": PARTNER_REGIONS[ti] if regions_ok else None,
                "url": canonical_url(a["href"]),
            })
    return {"published": published.group(1) if published else None, "regionsFromTableOrder": regions_ok,
            "partners": partners}


def parse_brand_groups(page):
    """按集團品牌區分: one table per brand group (the group names are logos without text)."""
    groups = []
    for t in re.findall(r"<table\b.*?</table>", main_html(page), re.S):
        names = [(a["title"] or a["text"]).strip() for a in links(t, DEPT_BASE) if (a["title"] or a["text"])]
        if names:
            groups.append(names)
    return groups


def parse_notices(page):
    body = main_html(page)
    m = re.search(r'<div class="mpgdetail">(.*)', body, re.S)
    return [ln for ln in lines(m.group(1) if m else body) if re.match(r"\d{4}\.\d{2}\.\d{2}", ln)]


# ---------------------------------------------------------------- pdf documents

def pdf_text(raw):
    try:
        from pypdf import PdfReader  # optional
    except ImportError:
        return None
    reader = PdfReader(io.BytesIO(raw))
    text = "\n".join((p.extract_text() or "") for p in reader.pages)
    return [ln.strip() for ln in text.split("\n") if ln.strip()]


# ---------------------------------------------------------------- build

def build(previous):
    home = fetch(DEPT_URL)
    menu, menu_order = parse_menu(home)
    missing = [k for k in DEPT_PAGES if k not in menu]
    if missing:
        raise SyncError(f"department menu: missing {missing}")
    pages = {key: (menu[k], fetch(menu[k])) for k, key in DEPT_PAGES.items()}

    # faculty: the college list is the primary source, each profile adds 學歷/類別; the department's own
    # faculty page is kept alongside so differences between the two official sites stay visible.
    flist = fetch(FACULTY_URL)
    faculty = parse_faculty_list(flist)
    dept_faculty = parse_dept_faculty(pages["facultyDept"][1])
    for p in faculty:
        p["profile"] = parse_profile(fetch(p["profileUrl"]))
        dept = next((d for d in dept_faculty if p["name"] in d["heading"].replace("　", "").replace(" ", "")), None)
        if dept:
            prof = parse_profile(fetch(dept["url"]))
            prof["url"] = dept["url"]
            p["departmentProfile"] = prof

    # names of the other units' teachers on the same college site — used only to make sure no non-HTL teacher
    # appears on this site (scripts/sync.py --verify); never shown.
    others = set()
    for unit in OTHER_FACULTY_PAGES:
        for p in parse_faculty_list(fetch(FACULTY_URL.replace("412-1016-854", f"412-1016-{unit}"))):
            if p["name"] not in {f["name"] for f in faculty}:
                others.add(p["name"])
    if len(others) < 5:
        raise SyncError("other college faculty lists parsed too few names")

    partners = parse_partners(pages["partnersByRegion"][1])
    partners["url"] = pages["partnersByRegion"][0]
    partners["brandGroupsUrl"] = pages["partnersByBrand"][0]
    partners["brandGroups"] = parse_brand_groups(pages["partnersByBrand"][1])

    data = {
        "schemaVersion": 1,
        "sources": SOURCES,
        "department": {
            "name": "國立高雄餐旅大學 旅館管理系",
            "url": DEPT_URL,
            "contact": parse_footer(home),
            "menu": menu_order,
            "activities": parse_activities(home),
        },
        "intro": {"url": pages["intro"][0], "sections": parse_sections(pages["intro"][1])},
        "philosophy": {"url": pages["philosophy"][0], "sections": parse_sections(pages["philosophy"][1])},
        "administration": {"url": pages["administration"][0], "sections": parse_sections(pages["administration"][1])},
        "faculty": {"url": FACULTY_URL, "departmentUrl": pages["facultyDept"][0], "members": faculty},
        "staff": {"url": pages["staff"][0], "members": parse_staff(pages["staff"][1])},
        "curriculum": {"url": pages["curriculum"][0], "tables": parse_curriculum(pages["curriculum"][1])},
        "graduation": {"url": pages["graduation"][0], "documents": parse_doc_list(pages["graduation"][1])},
        "curriculumMap": {"url": pages["curriculumMap"][0], "documents": parse_doc_list(pages["curriculumMap"][1])},
        "regulations": {"url": pages["regulations"][0], "documents": parse_doc_list(pages["regulations"][1])},
        "eliteHouse": {
            "site": menu.get(("群賢會館", "官網連結")),
            "booking": canonical_url(menu.get(("群賢會館", "訂房連結"), "")) or None,
            "tourBooking": menu.get(("群賢會館", "導覽預約系統")),
            "regulationsUrl": pages["eliteHouseRegulations"][0],
            "regulations": parse_doc_list(pages["eliteHouseRegulations"][1]),
        },
        "internshipPartners": partners,
        "internshipNotices": {"url": pages["internshipNotices"][0], "items": parse_notices(pages["internshipNotices"][1])},
        "otherCollegeFaculty": {"note": "餐旅學院其他單位與退休教師姓名，僅供檢查本站不得出現非旅館系教師", "names": sorted(others)},
        "documents": {},
    }

    # PDFs: keep the previous text when pypdf is missing or the download fails.
    prev_docs = (previous or {}).get("documents", {})
    wanted = []
    for key, (listing, pattern) in DOCUMENTS.items():
        lst = data[listing]["documents"] if listing in data else []
        doc = next((d for d in lst if re.search(pattern, d["title"])), None)
        if doc:
            wanted.append((key, doc))
    # newest 日間部四年制 curriculum standard (last row of the first table on 課程標準表)
    day = next((t for t in data["curriculum"]["tables"] if "日間部四年制" in t["program"]), None)
    if day and day["rows"] and day["rows"][-1].get("pdf"):
        row = day["rows"][-1]
        wanted.append(("curriculumLatest", {"title": f"日間部四年制課程標準表 {row['label']}", "url": row["pdf"]}))
    for key, doc in wanted:
        entry = {"title": doc["title"], "url": doc["url"]}
        try:
            raw = fetch(doc["url"], binary=True)
            entry["sha256"] = hashlib.sha256(raw).hexdigest()
            text = pdf_text(raw) if raw[:4] == b"%PDF" else None
        except SyncError:
            text, raw = None, None
        old = prev_docs.get(key, {})
        if text is None and old.get("url") == doc["url"]:
            entry["text"] = old.get("text")
            entry.setdefault("sha256", old.get("sha256"))
        elif text is not None:
            entry["text"] = text
        data["documents"][key] = entry

    counts = {
        "faculty": len(faculty), "staff": len(data["staff"]["members"]),
        "partners": len(partners["partners"]), "curriculum": len(data["curriculum"]["tables"]),
        "regulations": len(data["regulations"]["documents"]),
    }
    low = {k: v for k, v in counts.items() if v < MIN_COUNTS[k]}
    if low:
        raise SyncError(f"parsed too few records {low}; the official page layout may have changed")
    for p in faculty:
        if not p.get("title") or not p.get("email"):
            raise SyncError(f"faculty record incomplete: {p.get('name')}")
    return data, counts


def dumps(data):
    return json.dumps(data, ensure_ascii=False, indent=1) + "\n"


def load_corrections():
    return json.loads(CORRECTIONS.read_text(encoding="utf-8")) if CORRECTIONS.exists() else {}


def faculty_contact(f, corrections=None):
    """Extension list and e-mail for one teacher, by the rules the department set:
      1. 系網 (hotel.nkuht.edu.tw 師資介紹 個人頁) is primary for extension and e-mail.
      2. Extra extensions that appear only on the 餐旅學院 pages are kept for teachers with an administrative
         post (職稱含「兼」), labelled 行政; otherwise they are dropped (e.g. 楊仁德 #5261 / 20200).
      3. data/corrections.json (confirmed by the person) overrides both.
    Returns (ext list of {number, label}, display string, e-mail, correction or None)."""
    prof = f.get("profile", {})
    dept = f.get("departmentProfile", {})
    fix = (corrections or {}).get("faculty", {}).get(f["name"])
    title = (fix and fix.get("title")) or f.get("title") or prof.get("title") or ""
    email = dept.get("email") or prof.get("email") or f.get("email")
    if fix and fix.get("email"):
        email = fix["email"]
    if fix and fix.get("ext"):
        ext = [dict(e) for e in fix["ext"]]
    else:
        primary = dept.get("ext") or prof.get("ext") or f.get("ext") or []
        ext = [{"number": n, "label": ""} for n in primary]
        if "兼" in title:
            for n in (prof.get("ext") or f.get("ext") or []):
                if n not in primary:
                    ext.append({"number": n, "label": "行政"})
    plain = [e["number"] for e in ext if not e["label"]]
    parts = []
    if plain:
        parts.append("、".join(plain))
    labelled = {}
    for e in ext:
        if e["label"]:
            labelled.setdefault(e["label"], []).append(e["number"])
    for label, nums in labelled.items():
        parts.append(f"{label} " + "、".join(nums))
    return ext, "；".join(parts), email, fix


def module_source(data):
    """official-data.js: the parts of official.json the 3D app reads directly (faculty cards, contact, partners).
    Generated — edit data/official.json via this script, never by hand."""
    faculty = []
    corrections = load_corrections()
    for f in data["faculty"]["members"]:
        prof = f.get("profile", {})
        dept = f.get("departmentProfile", {})
        ext, ext_display, email, fix = faculty_contact(f, corrections)
        faculty.append({
            "name": f["name"],
            # title / specialties / courses: the college list page (專長 even where the page mislabels it 「專案」);
            # extension / e-mail: see faculty_contact(); 學歷・類別: own college page.
            "title": (fix and fix.get("title")) or f.get("title") or prof.get("title"),
            "ext": [e["number"] for e in ext],
            "extDisplay": ext_display,
            "extNote": (f"{fix.get('confirmedBy', '')}更正（{fix.get('confirmedAt', '')}）" if fix else None),
            "email": email,
            "specialties": f.get("specialties") or prof.get("specialties") or [],
            "courses": f.get("courses") or [],
            "education": prof.get("education"),
            "category": prof.get("category"),
            "profileUrl": f["profileUrl"],
            "departmentProfileUrl": dept.get("url"),
            "departmentSpecialties": dept.get("specialties") or [],
        })
    out = {
        "sources": data["sources"],
        "contact": data["department"]["contact"],
        "faculty": faculty,
        "partners": data["internshipPartners"]["partners"],
        "partnersUrl": data["internshipPartners"]["url"],
        # 第四期 (quiz generator, bulletin board, 群賢會館 stages): titles, numbers and links only, as published
        "brandGroups": data["internshipPartners"].get("brandGroups") or [],
        "curriculum": [
            {"program": t["program"], "url": data["curriculum"]["url"],
             "rows": [{k: r.get(k, "") for k in ("label", "pdf", "畢業學分數", "校訂必修", "院訂必修", "系訂必修", "系訂選修")} for r in t["rows"]]}
            for t in data["curriculum"]["tables"]
        ],
        "regulations": {"url": data["regulations"]["url"], "documents": data["regulations"]["documents"]},
        "eliteHouse": {"regulationsUrl": data["eliteHouse"].get("regulationsUrl"), "regulations": data["eliteHouse"].get("regulations") or []},
        "activities": data["department"].get("activities") or [],
        "internshipNotices": {"url": data["internshipNotices"]["url"], "items": data["internshipNotices"]["items"]},
    }
    return ("// Generated by scripts/sync.py from data/official.json — do not edit by hand.\n"
            "// Sources: " + " , ".join(data["sources"].values()) + "\n"
            "export const OFFICIAL = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n"
            "export default OFFICIAL;\n")


def summarize_changes(old, new):
    if not old:
        return ["(new file)"]
    out = []

    def by(lst, key):
        return {x.get(key): x for x in lst}

    of, nf = by(old["faculty"]["members"], "name"), by(new["faculty"]["members"], "name")
    for n in sorted(set(of) | set(nf)):
        if n not in of:
            out.append(f"faculty + {n}")
        elif n not in nf:
            out.append(f"faculty - {n}")
        else:
            for k in ("title", "ext", "email", "specialties", "courses"):
                if of[n].get(k) != nf[n].get(k):
                    out.append(f"faculty ~ {n}.{k}: {of[n].get(k)} → {nf[n].get(k)}")
    op = [p["name"] for p in old["internshipPartners"]["partners"]]
    np_ = [p["name"] for p in new["internshipPartners"]["partners"]]
    for n in np_:
        if n not in op:
            out.append(f"partner + {n}")
    for n in op:
        if n not in np_:
            out.append(f"partner - {n}")
    if old["department"]["contact"] != new["department"]["contact"]:
        out.append(f"contact ~ {new['department']['contact']}")
    if old["staff"] != new["staff"]:
        out.append("staff ~ 行政人員 changed")
    for key in ("intro", "philosophy", "administration", "curriculum", "graduation", "curriculumMap",
                "regulations", "eliteHouse", "internshipNotices", "documents"):
        if old.get(key) != new.get(key):
            out.append(f"{key} ~ changed")
    return out or ["(content identical apart from ordering)"]


# ---------------------------------------------------------------- verification of the site data

# Claims that contradicted the official sites before and must not come back.
STALE_CLAIMS = [
    (r"\bInfor\b", "PMS：官網特殊設備僅列 Oracle Hospitality OPERA PMS 與德安資訊 PMS（系上決定依官網，2026-11-12）"),
    (r"85\s*年\s*2\s*月", "首屆開課：官網為「八十五年三月一日正式開課」（系上決定依官網）"),
    (r"智能服務(?:培育|培訓)中心", "中心名稱：官網為「智能服務中心」（系上決定依官網）"),
    (r"多益\s*700\s*分標竿", "英語門檻：官網 A 類相當於 TOEIC 600 分以上（B 類外語為 700 分）"),
    (r"C402", "系辦位置：官網為「第一教學大樓(F棟)1樓」"),
    (r"22000", "系辦電話：官網為 07-8060505 轉 20202、20201"),
    (r"8060966", "系辦傳真：官網為 07-8062361"),
    (r"觀光學院", "學院名稱：shm.nkuht.edu.tw 為「餐旅學院」"),
    (r"(?:20|23)\s*家", "菁英實習合作機構家數：以 data/official.json 的 internshipPartners（24 家）為準"),
    (r"涵碧樓|晶英酒店|高雄洲際|高雄萬豪|承億", "非官網菁英實習合作機構名單"),
    (r"412-1022-", "失效的來源網址（hotel.nkuht.edu.tw 網站代碼為 1018）"),
    (r"(?<![A-Za-z])enchin@", "謝文欽信箱：個人頁為 wenchin@mail.nkuht.edu.tw（列表頁誤植）"),
    (r"吳欣庭|張慧瑛|蔡博任", "人員姓名：以官網「師資」「行政人員」頁為準"),
    (r"1\s*張外語檢定證書\s*\+\s*3\s*張", "1+3：官網為「1 張畢業證書 + 3 張相關證照」"),
    (r"廚藝|烹調", "旅館管理系無廚藝或烹調課程，餐飲相關課程為餐飲實務、採購與成本控制、宴會管理、酒類專業知識、安全與衛生"),
    (r"畢業專題|專題製作|專題發表|專題研究|專題競賽", "旅館管理系無畢業專題或專題製作課程"),
    (r"李姿瑩|陳柚蓁|王聰榮|蘇國垚|陳勇全|吳繼文|林玥秀|張明玲|何秉燦|莉芝|學術領航", "師資僅列出餐旅學院師資頁（shm.nkuht.edu.tw/p/412-1016-854.php）之 10 位專任(案)教師"),
    (r"elitehouse\.nkuht\.edu\.tw", "失效的群賢會館舊網域（請改用 hotel.nkuht.edu.tw/p/403-1018-608.php）"),
    (r"副主任", "旅館管理系現無設副主任（沙荃職稱為「助理教授級專技人員」）"),
    (r"(?i)jin-?xu|金旭", "群賢會館 PMS：官網為 Oracle Hospitality OPERA PMS 與德安資訊 PMS（無金旭）"),
    (r"(?i)54\s*(?:間|-?rooms?|guest\s*rooms?|guestrooms?)|4\s*種房型|room types", "群賢會館客房數：系上確認為 12 間（data/corrections.json facts），官網未載明房型數"),
    (r"(?<!\d)18\s*間|(?i:18 (?:practicum|suites))|小套房|總統套房|使用率\s*(?:達\s*)?100|100%\s*高效", "群賢會館：系上確認為 12 間實習客房（data/corrections.json），勿寫樓層、房型配置或使用率"),
    (r"89\s*年[（(]?2000|2000\s*改制|改制四技|二專", "沿革：84 年核定成立旅館管理科、85 年 3 月 1 日開課、89 年 8 月升格二年制、91 年增設四年制（無二專）"),
    (r"萬豪國際培育學院|萬豪育才學院", "萬豪學院名稱為「萬豪國際集團育才學院（Marriott Class）」（113.11 揭牌）"),
    (r"侍酒技術|五感調飲|咖啡感官|侍茶服務|花藝與空間|永續碳盤查|神秘客服務品質稽核|院、校、部|0\.5\s*學分", "奢華體驗管理微學分：8 門課名以系所評鑑簡報 s48 為準（皆已完成三級三審，無學分數／時數資料）"),
    (r"逾\s*30\s*(?:件|篇)|30\+ (?:research|SSCI)", "研究成果：只寫 data/research.json（GRB）查得的計畫，不寫件數"),
    (r"研究計畫\s*14\s*件|14 research|產學合作\s*8\s*件|8 industry projects|期刊論文\s*15\s*篇|15 journal papers|國際期刊\s*14\s*篇|14 international journal",
     "研究件數（評鑑簡報）無公開來源可查證：改列 data/research.json（GRB）查得的計畫"),
    (r"星級旅館評鑑制度研修|Star Hotel Evaluation System Study",
     "GRB 計畫名稱為交通部觀光局委託「星級旅館評鑑制度革新之研究」（108–110 年，沙荃主持）"),
    (r"親子與寵物友善旅宿|pet-friendly lodging", "GRB 與官網皆查無高雄市觀光局親子與寵物友善旅宿輔導案"),
    (r"國科會研究獎勵|NSTC research awards?|教學實踐研究績優|outstanding Teaching Practice|優秀年輕學者|Young Scholar|ESG × Big Data",
     "無公開來源（GRB 未列）的獎勵或計畫類別"),
    (r"智慧餐飲旗艦計畫", "此計畫執行機關非本校（GRB），本系教師僅為協同，不列"),
    (r"(?:榮獲|(?<!曾)入選|(?<![曾入])獲得?|recogni[sz]ed|listed among|include)[^。\"]{0,40}(?:Stanford|史丹佛)|(?:Stanford|史丹佛)[^。\"]{0,12}(?:全球前|Top)\s*2\s*%[^。\"]{0,12}(?:肯定|殊榮|recognition)",
     "全球前 2% 科學家：楊仁德教授僅入選 2021–2023 年發布之單年度榜（data/research.json top2），不可寫成現況"),
    (r"25\s*家實習旅館|25\s*Hotels", "實習旅館：24 家菁英實習合作旅館＋校內群賢會館"),
    (r"Les Clefs d'Or(?! Island)|金鑰匙協會", "Gold Touch 金鑰匙管家培訓為中程計畫 S1，非金鑰匙協會（Les Clefs d'Or）合作"),
    (r"濱海灣金沙|萊佛士|樟宜|Marina Bay Sands|Raffles|新南向|西武王子", "海外實習與研修：新加坡、日本、澳洲、美加（系所評鑑簡報 s16、s30），勿列未經證實的飯店"),
    (r"830\.6|1,?396\s*萬|1,?113\s*萬|283\s*萬|13\.96\s*M|8\.306\s*M", "計畫與經費金額為內部資料，網站不揭露金額"),
    (r"113[–-]115\s*年|綜合教學大樓", "D 棟 8 樓餐旅數位智慧服務與創新基地：114 年 3 月揭牌（不寫補助年度、大樓名稱或金額）"),
    (r"ISO 14064-1|好客民宿評鑑|考選部|Serve 360|Journey to Tomorrow|Forbes|富比士|米其林|Michelin", "未經證實之教師證照、評鑑委員或國際標竿說法"),
    (r"6\+6|每月調薪|monthly raise|雙週記", "菁英實習 3.0：前六個月客房部、第七個月起調薪 1,000 元以上並輪調；實習日誌或週記"),
    (r"認證教師|四學期必修", "EMI：14 門課、8 位教師、三年 37 門次，5 位教師具全英授課專業證照；必修為旅館英文(一)、旅館日文(一)(二)"),
]


def verify_csp():
    """Strict CSP (2026-11-13): no executable inline <script> in served HTML, and the importmap hash in _headers."""
    import base64, hashlib, glob
    problems = []
    headers = (ROOT / "_headers").read_text(encoding="utf-8")
    pages = [ROOT / "index.html", ROOT / "timeline.html", ROOT / "404.html"] + [Path(f) for f in glob.glob(str(ROOT / "p" / "*" / "index.html"))]
    for page in pages:
        if not page.exists():
            continue
        html_text = page.read_text(encoding="utf-8")
        for m in re.finditer(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", html_text, re.S):
            attrs, body = m.group("attrs"), m.group("body")
            if "src=" in attrs or not body.strip():
                continue
            if re.search(r'type="application/(ld\+)?json"', attrs):
                continue
            digest = "sha256-" + base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode()
            if digest not in headers:
                problems.append(f"{page.relative_to(ROOT)}: inline <script{attrs}> is blocked by the CSP — move it to a file, or add '{digest}' to script-src in _headers")
    for m in re.finditer(r"on(click|load|error|change|input|submit)=\"", "".join(p.read_text(encoding="utf-8") for p in pages if p.exists())):
        problems.append(f"inline on{m.group(1)}= handler is blocked by the CSP — use addEventListener")
    return problems


def verify(official):
    """Returns a list of problems in the site data compared with data/official.json."""
    problems = verify_csp()
    texts = {}
    for p in POLICIES + [q for q in list(ROOT.glob("*.js")) + list(ROOT.glob("*.html")) + list(ROOT.glob("assets/*.js")) if q.name != "official-data.js"]:
        if p.exists():
            texts[p.relative_to(ROOT).as_posix()] = p.read_text(encoding="utf-8")
    for name, t in texts.items():
        for pat, why in STALE_CLAIMS:
            for m in re.finditer(pat, t):
                line = t.count("\n", 0, m.start()) + 1
                problems.append(f"{name}:{line}: {why}")
    # cityscape exception (CLAUDE.md): the Kaohsiung skyline may carry only landmark names and shapes, no facts
    sky = texts.get("kaohsiung-skyline.js")
    if sky is not None:
        m = re.search(r"/\* SKYLINE-DATA \*/\s*const SKYLINE = (\[.*?\]);\s*/\* END-SKYLINE-DATA \*/", sky, re.S)
        if not m:
            problems.append("kaohsiung-skyline.js: SKYLINE-DATA block missing or not a plain JSON array")
        else:
            try:
                for e in json.loads(m.group(1)):
                    extra = set(e) - {"id", "icon", "name"}
                    if extra:
                        problems.append(f"kaohsiung-skyline.js {e.get('id')}: only id / icon / name are allowed (cityscape exception), found {sorted(extra)}")
                    if set(e.get("name", {})) - {"zh", "en"}:
                        problems.append(f"kaohsiung-skyline.js {e.get('id')}: name may hold only zh / en")
            except json.JSONDecodeError as err:
                problems.append(f"kaohsiung-skyline.js: SKYLINE-DATA is not valid JSON ({err})")
    # campus art exception (CLAUDE.md): campus-art.js may carry only the General Affairs list's codes and titles, no facts
    CAMPUS_ART = dict(zip("ABCDEFGHIJKLMNOPQRSTUVWX", ["聚", "迎向新世界", "同心", "有鳳來儀", "太陽之子", "心之旅", "飛翔的雲", "幻相", "山水", "書香滿行囊", "見樹又見林", "天體", "春風化雨", "初生", "站立與橫躺", "黑天鵝", "裸女", "圓融", "溝通", "臺灣牛", "游刃有餘", "許願", "享宴", "藍霓"]))
    CAMPUS_ART_EN = dict(zip("ABCDEFGHIJKLMNOPQRSTUVWX", ["Gathering", "Forwarding to a New World", "Heart to Heart", "Auspicious Phoenix", "Son of the Sun", "Journey of the Heart", "Drifting Clouds", "Vision", "Scenery", "Building Blocks of Knowledge", "Seeing the Trees and the Forest", "Body", "Cultivating the Youths", "Origin", "Standing & Lying", "Black Swan", "Nude", "Completeness of Life", "Communication", "Taiwan Buffalo", "Professionalism", "Wish", "Enjoy the Feast", "Blue Neon"]))
    art = texts.get("campus-art.js")
    if art is not None:
        m = re.search(r"/\* ART-DATA \*/\s*export const ART = (\[.*?\]);\s*/\* END-ART-DATA \*/", art, re.S)
        if not m:
            problems.append("campus-art.js: ART-DATA block missing or not a plain JSON array")
        else:
            try:
                for e in json.loads(m.group(1)):
                    extra = set(e) - {"id", "code", "name", "en"}
                    if extra:
                        problems.append(f"campus-art.js {e.get('id')}: only id / code / name / en are allowed (campus art exception), found {sorted(extra)}")
                    if CAMPUS_ART.get(e.get("code")) != e.get("name"):
                        problems.append(f"campus-art.js {e.get('id')}: code {e.get('code')} / name {e.get('name')} not on the General Affairs campus art list")
                    if "en" in e and CAMPUS_ART_EN.get(e.get("code")) != e["en"]:
                        problems.append(f"campus-art.js {e.get('id')}: English title {e['en']} differs from the campus map")
            except json.JSONDecodeError as err:
                problems.append(f"campus-art.js: ART-DATA is not valid JSON ({err})")
    # 鐘聲時刻例外 (CLAUDE.md): bell-schedule.json holds only class periods (period / start / end), identical copies
    bell = [ROOT / "data/bell-schedule.json", ROOT / "bell-schedule.json"]
    if any(p.exists() for p in bell):
        raw = [p.read_bytes() if p.exists() else b"" for p in bell]
        if raw[0] != raw[1]:
            problems.append("bell-schedule.json differs from data/bell-schedule.json (copy data/bell-schedule.json over it)")
        try:
            bs = json.loads(raw[0] or b"{}")
            if set(bs) - {"source", "timeZone", "days", "periods"}:
                problems.append(f"bell-schedule.json: only source / timeZone / days / periods are allowed (bell schedule exception), found {sorted(set(bs) - {'source', 'timeZone', 'days', 'periods'})}")
            if not all(isinstance(d, int) and 1 <= d <= 7 for d in bs.get("days", [])):
                problems.append("bell-schedule.json: days must be integers 1–7")
            for per in bs.get("periods", []):
                if set(per) - {"period", "start", "end"}:
                    problems.append(f"bell-schedule.json period {per.get('period')}: only period / start / end are allowed")
                hm = [re.fullmatch(r"([01]\d|2[0-3]):([0-5]\d)", str(per.get(k, ""))) for k in ("start", "end")]
                if not all(hm):
                    problems.append(f"bell-schedule.json period {per.get('period')}: start / end must be HH:MM")
                elif int(hm[0][1]) * 60 + int(hm[0][2]) >= int(hm[1][1]) * 60 + int(hm[1][2]):
                    problems.append(f"bell-schedule.json period {per.get('period')}: start must be before end")
        except json.JSONDecodeError as err:
            problems.append(f"bell-schedule.json is not valid JSON ({err})")
    # research projects named on the site (「…」 right after 國科會/觀光局 … 年) must be GRB titles in data/research.json
    research = json.loads(RESEARCH.read_text(encoding="utf-8")) if RESEARCH.exists() else {}
    norm = lambda x: re.sub(r"[\W_]+", "", x)
    grb_titles = [norm(pr["title"]) for pr in research.get("projects", [])]
    for name, t in texts.items():
        for m in re.finditer(r"(?:國科會|觀光局（現觀光署）委託)[^「」。]{0,20}?「([^」]{6,})」", t):
            if not any(norm(m.group(1)) in g for g in grb_titles):
                line = t.count("\n", 0, m.start()) + 1
                problems.append(f"{name}:{line}: 「{m.group(1)[:30]}」 is not a GRB project title in data/research.json")
    top2 = research.get("top2", {}).get("versions", [])
    if top2 and any(h.get("teacher") for h in max(top2, key=lambda v: v["version"])["career"] + max(top2, key=lambda v: v["version"])["singleYear"]):
        problems.append("data/research.json: the latest top-2% list now includes a teacher — update the site's past-tense wording")
    # data/policies.json and the served policies.json must be the same file.
    a, b = (p.read_bytes() if p.exists() else b"" for p in POLICIES)
    if a != b:
        problems.append("policies.json differs from data/policies.json (copy data/policies.json over it)")
    # faculty cards read official-data.js, which must be the current rendering of data/official.json
    if not MODULE.exists() or MODULE.read_text(encoding="utf-8") != module_source(official):
        problems.append("official-data.js is out of date (run python scripts/sync.py)")
    people = texts.get("people.js", "")
    if "official-data.js" not in people:
        problems.append("people.js must import official-data.js (faculty title / ext / e-mail come from there)")
    for m in re.finditer(r'\b(ext|email):\s*"', people):
        line = people.count("\n", 0, m.start()) + 1
        problems.append(f"people.js:{line}: hard-coded {m.group(1)}; it must come from official-data.js")
    # every faculty building shows exactly the extension / e-mail that official-data.js shows
    pol = json.loads(POLICIES[0].read_text(encoding="utf-8")) if POLICIES[0].exists() else {"islands": []}
    corrections = load_corrections()
    for f in official["faculty"]["members"]:
        ext, ext_display, email, fix = faculty_contact(f, corrections)
        shown = {e["number"] for e in ext}
        for isl in pol["islands"]:
            for b in isl["buildings"]:
                if not b["name"]["zh"].startswith(f["name"]):
                    continue
                plain = b.get("plain", {}).get("zh", "")
                if ext_display not in plain or email not in plain:
                    problems.append(f"policies.json {b['id']}: plain must contain 分機「{ext_display}」 and {email}")
                for n in re.findall(r"(?<!\d)(\d{4,5})(?!\d)", json.dumps(b, ensure_ascii=False)):
                    every = set(f.get("ext") or []) | set(f.get("profile", {}).get("ext") or []) | set(f.get("departmentProfile", {}).get("ext") or [])
                    if n in every and n not in shown:
                        problems.append(f"policies.json {b['id']}: shows extension {n}, which is not used for {f['name']}")
                if "專案：" in plain or any("專案：" in x.get("zh", "") for x in b.get("facts", [])):
                    problems.append(f"policies.json {b['id']}: 「專案：」 is the list page's typo for 專長")
    # year stages (4-year timeline) only where the grounded phase label states the year
    for isl in pol["islands"]:
        for b in isl["buildings"]:
            label = b.get("phase", {}).get("label", {}).get("zh", "")
            want = [s for s, pat in (("m8-18", r"第二學年|大二"), ("year3-4", r"第三學年|校外實習"), ("year5-8", r"第四學年|大四|畢業後")) if re.search(pat, label)]
            if b.get("phase", {}).get("stages", []) != want:
                problems.append(f"policies.json {b['id']}: phase.stages {b['phase'].get('stages')} do not match the label 「{label}」 (expected {want})")
    # only the 10 HTL teachers may appear anywhere on the site: no other college teachers, staff or invented names
    blocked = set(NEVER_NAMES) | set(official.get("otherCollegeFaculty", {}).get("names", []))
    blocked |= {s["name"] for s in official["staff"]["members"] if s.get("name")} | {s["deputy"] for s in official["staff"]["members"] if s.get("deputy")}
    htl = {f["name"] for f in official["faculty"]["members"]}
    blocked -= htl
    shipped = [p for p in list(ROOT.glob("*.js")) + list(ROOT.glob("*.html")) + list(ROOT.glob("assets/*.js")) + list(ROOT.glob("p/*/index.html")) + POLICIES + [ROOT / "manifest.webmanifest"] if p.exists()]
    SURNAMES = "王李張劉陳楊黃趙吳周徐孫馬朱胡郭何林高羅鄭梁謝宋唐許韓馮鄧曹彭曾蕭田董袁潘蔡蔣余杜葉程蘇魏呂丁沈任姚盧傅鍾姜崔譚廖范汪陸金石戴賈韋夏邱方侯鄒熊孟秦白江閻薛尹段雷黎史龍賀顧毛郝龔邵萬錢嚴賴覃洪武莫孔湯向常溫康施文牛樊葛邢安齊易喬伍龐顏倪莊聶章魯岳翟殷詹申歐耿關蘭焦俞左柳甘祝包寧尚符舒阮柯紀梅童凌畢單季裴霍涂成苗谷盛曲翁冉駱藍路游辛靳管柴蒙鮑華喻祁蒲房滕屈饒解牟艾尤陽時穆農司卓古吉繆簡車項連芮"
    role_words = ("專任", "專案", "兼任", "助理", "實習", "輔導", "指導", "任課", "系", "副", "校", "院", "組", "位", "的", "與", "和", "及")
    for p in shipped:
        t = p.read_text(encoding="utf-8", errors="replace")
        rel = p.relative_to(ROOT).as_posix()
        for n in blocked:
            if n in t:
                problems.append(f"{rel}: 「{n}」 is not a 旅館管理系 teacher (only the 10 on the official faculty page may appear)")
        for m in re.finditer(r"([\u4e00-\u9fff]{2,3})(?:老師|教授|主任)", t):
            n = m.group(1)
            if n[0] in SURNAMES and n not in htl and not any(h in n or n in h for h in htl) and not n.endswith(role_words) and not n.startswith(("專", "助", "副")):
                problems.append(f"{rel}: 「{m.group(0)}」 looks like a teacher who is not on the official HTL faculty page")
    # named faculty anywhere in the island data must exist on the official shm.nkuht.edu.tw faculty page
    names = {f["name"] for f in official["faculty"]["members"]}
    not_names = ("任課", "輔導", "指導", "專任", "專案", "兼任", "實習", "優良", "業界", "技術", "著重", "由", "位", "各", "的", "與")
    for p in POLICIES[:1] + [PEOPLE]:
        t = p.read_text(encoding="utf-8")
        for m in re.finditer(r"([\u4e00-\u9fff]{2,3})老師", t):
            n = m.group(1)
            if any(n.endswith(x) for x in not_names) or any(n.endswith(x) or x.endswith(n) for x in names):
                continue
            problems.append(f"{p.relative_to(ROOT).as_posix()}: 「{m.group(0)}」 is not on the official faculty pages")
    return problems


# ---------------------------------------------------------------- main

def correction_notes(official):
    """Reminders for data/corrections.json: still needed, no longer needed, or the official site changed."""
    notes = []
    members = {f["name"]: f for f in official["faculty"]["members"]}
    for name, fix in load_corrections().get("faculty", {}).items():
        f = members.get(name)
        if not f:
            notes.append(f"corrections.json: {name} is no longer on the official faculty page — remove the entry")
            continue
        site = f.get("profile", {}).get("ext") or f.get("ext") or []
        want = [e["number"] for e in fix.get("ext", [])]
        was = fix.get("officialShows", {}).get("ext")
        if sorted(site) == sorted(want):
            notes.append(f"corrections.json: the official site now shows {name}'s extension correctly — the entry can be removed")
        elif was is not None and sorted(site) != sorted(was):
            notes.append(f"corrections.json: {name}'s extension on the official site changed to {site} (was {was}) — please re-confirm")
        else:
            notes.append(f"corrections.json: official site still shows {name} #{','.join(site)}; site uses {'、'.join(want)} ({fix.get('confirmedBy', '')} {fix.get('confirmedAt', '')})")
    return notes


def stamp(**fields):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data = json.loads(SYNC.read_text(encoding="utf-8")) if SYNC.exists() else {}
    data.update({k: now for k, v in fields.items() if v})
    SYNC.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")


def main(argv):
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    check, no_stamp, verify_only = "--check" in argv, "--no-stamp" in argv, "--verify" in argv
    previous = json.loads(OFFICIAL.read_text(encoding="utf-8")) if OFFICIAL.exists() else None

    if verify_only:
        if not previous:
            print("data/official.json is missing; run python scripts/sync.py first", file=sys.stderr)
            return 2
        problems = verify(previous)
        for p in problems:
            print("  ✗", p)
        for n in correction_notes(previous):
            print("  ℹ", n)
        print(f"verify: {len(problems)} problem(s)")
        return 1 if problems else 0

    try:
        data, counts = build(previous)
    except SyncError as e:
        print(f"sync: {e}\n(data/official.json was left unchanged)", file=sys.stderr)
        return 2
    print("official: " + ", ".join(f"{k} {v}" for k, v in counts.items()))
    changed = previous is None or dumps(previous) != dumps(data)

    if check:
        if changed:
            for line in summarize_changes(previous, data):
                print("  ", line)
            print("sync --check: the official data changed")
            return 10
        print("sync --check: official data unchanged")
        for n in correction_notes(data):
            print("  ℹ", n)
        if not no_stamp:
            stamp(checkedAt=True)
        return 0

    if changed:
        for line in summarize_changes(previous, data):
            print("  ", line)
        OFFICIAL.write_text(dumps(data), encoding="utf-8")
        print(f"wrote {OFFICIAL.relative_to(ROOT).as_posix()}")
    else:
        print("official data unchanged")
    module = module_source(data)
    if not MODULE.exists() or MODULE.read_text(encoding="utf-8") != module:
        MODULE.write_text(module, encoding="utf-8")
        print(f"wrote {MODULE.relative_to(ROOT).as_posix()}")
    if not no_stamp:
        stamp(fetchedAt=changed, checkedAt=True)

    problems = verify(data)
    for p in problems:
        print("  ✗", p)
    for n in correction_notes(data):
        print("  ℹ", n)
    print(f"verify: {len(problems)} problem(s) in the site data")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
