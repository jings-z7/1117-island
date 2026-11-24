#!/usr/bin/env python3
"""Writes one complete standalone bilingual data & share page per item to p/<id>/index.html, from data/policies.json."""
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SITE = "https://nkuht-htl.drmjhsu.com/"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "p"
SHARE = ROOT / "assets/share"
MANIFEST = SHARE / "manifest.json"
OG_IMAGE = f"{SITE}assets/og.png?v={hashlib.sha256((ROOT / 'assets/og.png').read_bytes()).hexdigest()[:8]}"
CHROMES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
]

# The five official 特色目標 from the department's 教育理念 page (letters keep the HEART colour keys).
HEART = {
    "H": ("服務精神", "Service Ethics", "#5e9a6f"),
    "E": ("專業整合", "Integrated Expertise", "#b8920f"),
    "A": ("旅館軟硬體", "Hotel Systems", "#db6a41"),
    "R": ("理論實務並重", "Theory & Practice", "#3e7c8c"),
    "T": ("精通外語", "Foreign Languages", "#7a6fb0"),
}

# WCAG 2.1 AA (1.4.3): text needs a contrast ratio of at least 4.5:1. The theme colours above are kept
# for the 3D scene and preview images; on share pages they are darkened just enough to be readable.
def _lum(hex_color):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a, b):
    la, lb = sorted((_lum(a), _lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def readable(color, against="#ffffff", ratio=4.6):
    """Darken `color` in small steps until it reaches `ratio` against `against` (same hue)."""
    r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    out = color
    for _ in range(100):
        if contrast(out, against) >= ratio:
            break
        r, g, b = (max(0, int(v * 0.96)) for v in (r, g, b))
        out = f"#{r:02x}{g:02x}{b:02x}"
    return out


TEACHER_PHOTOS = {
    "welfare-elder": "../../assets/teachers/hsieh-wc.jpg",
    "welfare-respite": "../../assets/teachers/yang-jt.svg",
    "welfare-home": "../../assets/teachers/sha-c.jpg",
    "welfare-hourly": "../../assets/teachers/hsieh-jl.jpg",
    "welfare-care": "../../assets/teachers/huang-cy.jpg",
    "welfare-shingles": "../../assets/teachers/yu-mf.jpg",
    "welfare-counsel": "../../assets/teachers/hsieh-cl.jpg",
    "welfare-work": "../../assets/teachers/hsu-mj.jpg",
    "welfare-vaccine": "../../assets/teachers/chang-hc.jpg",
    "welfare-child": "../../assets/teachers/lo-sk.jpg",
}

TEACHER_IDS = {
    "welfare-elder": "hsieh-wc",
    "welfare-respite": "yang-jt",
    "welfare-home": "sha-c",
    "welfare-hourly": "hsieh-jl",
    "welfare-care": "huang-cy",
    "welfare-shingles": "yu-mf",
    "welfare-counsel": "hsieh-cl",
    "welfare-work": "hsu-mj",
    "welfare-vaccine": "chang-hc",
    "welfare-child": "lo-sk",
}

TEACHER_VOICES = {
    "welfare-elder": {
        "zh_mp3": "../../assets/voices/hsieh-wc-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/hsieh-wc-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真男聲（YunJhe Neural）",
        "en_label": "🔊 English Male Voice (Andrew Neural)",
        "zh_intro": "大家好，我是國立高雄餐旅大學旅館管理系副教授兼系主任兼學務長，謝文欽。我的專長領域為旅館服務業管理、旅館行銷管理與賭場管理。歡迎來到高餐大旅館管理系 3D 學習與職涯導覽島！",
        "en_intro": "Hello everyone! I am Wen-Chin Hsieh, Associate Professor, Department Chair, and Dean of Student Affairs in the Department of Hotel Management at NKUHT. My expertise covers hotel service management, hotel marketing management, and casino management. Welcome to our 3D Hotel Management Island!",
    },
    "welfare-respite": {
        "zh_mp3": "../../assets/voices/yang-jt-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/yang-jt-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真男聲（YunJhe Neural）",
        "en_label": "🔊 English Male Voice (Christopher Neural)",
        "zh_intro": "同學好，我是旅館管理系專任教授，楊仁德。我的專長涵蓋知識經濟與管理、管理心理學、組織行為、策略管理與服務業管理；在系上授課領域包含客房管理、餐飲管理、旅館管家實務、服務中心實務與客房營收管理。",
        "en_intro": "Greetings! I am Professor Jen-Te Yang in the Department of Hotel Management. My expertise spans knowledge economy, managerial psychology, organizational behavior, strategic management, and service management.",
    },
    "welfare-home": {
        "zh_mp3": "../../assets/voices/sha-c-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/sha-c-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真男聲（YunJhe Neural）",
        "en_label": "🔊 English Male Voice (Eric Neural)",
        "zh_intro": "大家好，我是旅館管理系助理教授級專技人員，沙荃。我的專長為旅館管理、人力資源與組織行為，並長期投入旅館客房服務與全國技能競賽旅館接待選手指導，歡迎同學一起挑戰自我、精進旅宿專業！",
        "en_intro": "Hello! I am Dr. Roger Sha, Assistant Professor (Specialist Track) in the Department of Hotel Management. My specialties include hotel management, human resources, and organizational behavior, as well as coaching national skills competition contestants in hotel reception.",
    },
    "welfare-hourly": {
        "zh_mp3": "../../assets/voices/hsieh-jl-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/hsieh-jl-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真女聲（HsiaoChen Neural）",
        "en_label": "🔊 English Female Voice (Ava Neural)",
        "zh_intro": "大家好，我是旅館管理系專任副教授，謝家黎。我的專長領域為人力資源管理、客務實務與國際禮儀。在旅館島上，我將帶領大家認識國際商務禮儀与星級客務接待的核心素養。",
        "en_intro": "Hello everyone! I am Associate Professor Amber Hsieh in the Department of Hotel Management. I specialize in human resource management, front office practice, and international etiquette.",
    },
    "welfare-care": {
        "zh_mp3": "../../assets/voices/huang-cy-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/huang-cy-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真男聲（YunJhe Neural）",
        "en_label": "🔊 English Male Voice (Brian Neural)",
        "zh_intro": "嗨，大家好！我是旅館管理系專任助理教授，黃啟揚。我的專長是旅館資訊管理、旅館行銷管理與餐廳管理。歡迎跟著我一起探索餐飲服務與旅館數位行銷！",
        "en_intro": "Hi everyone! I am Assistant Professor Chi-Yang Huang in the Department of Hotel Management. My expertise covers hotel information management, hotel marketing management, and restaurant management.",
    },
    "welfare-shingles": {
        "zh_mp3": "../../assets/voices/yu-mf-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/yu-mf-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真女聲（HsiaoYu Neural）",
        "en_label": "🔊 English Female Voice (Aria Neural)",
        "zh_intro": "各位同學好，我是旅館管理系專任助理教授，游明鳳。我的專長領域為旅館採購與旅館財務管理，帶領同學培養現代星級飯店不可或缺的經營管理決策力。",
        "en_intro": "Hello students! I am Assistant Professor Sally Yu in the Department of Hotel Management. I specialize in hotel purchasing and hotel financial management.",
    },
    "welfare-counsel": {
        "zh_mp3": "../../assets/voices/hsieh-cl-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/hsieh-cl-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真男聲（YunJhe Neural）",
        "en_label": "🔊 English Male Voice (Steffan Neural)",
        "zh_intro": "大家好，我是旅館管理系助理教授兼實習輔導組長，謝金龍。我的專長是旅館客務管理與旅館行銷管理。第三學年的校外實習與菁英實習計畫 3.0 的 24 家合作旅館，都會由我們陪伴同學順利銜接產業！",
        "en_intro": "Hello! I am Assistant Professor Benson Hsieh, Head of Internship Guidance in the Department of Hotel Management. My specialties are hotel front office management and hotel marketing, supporting students across our 24 Elite Internship 3.0 partner hotels.",
    },
    "welfare-work": {
        "zh_mp3": "../../assets/voices/hsu-mj-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/hsu-mj-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真男聲（YunJhe Neural）",
        "en_label": "🔊 English Male Voice (Roger Neural)",
        "zh_intro": "大家好，我是旅館管理系助理教授兼校務策略研究組長，許孟鈞。我的專長涵蓋雲端科技應用、資訊管理、知識管理、電子商務、餐旅資訊系統與數位行銷！",
        "en_intro": "Hello everyone! I am Dr. Jacques Hsu, Assistant Professor and Head of Institutional Strategy Research. My expertise spans cloud technology, information management, e-commerce, hospitality information systems, and digital marketing.",
    },
    "welfare-vaccine": {
        "zh_mp3": "../../assets/voices/chang-hc-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/chang-hc-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真女聲（HsiaoChen Neural）",
        "en_label": "🔊 English Female Voice (Jenny Neural)",
        "zh_intro": "同學好，我是旅館管理系專案助理教授，張慧貞。我的專長包括旅館會計學、旅館財務管理、會議管理與客務實務，很高興陪伴大家一路成長！",
        "en_intro": "Hello! I am Project Assistant Professor Winnie Chang in the Department of Hotel Management. My expertise includes hotel accounting, financial management, meeting management, and front office practice.",
    },
    "welfare-child": {
        "zh_mp3": "../../assets/voices/lo-sk-zh.mp3?v=20261110-16",
        "en_mp3": "../../assets/voices/lo-sk-en.mp3?v=20261110-16",
        "zh_label": "🔊 中文擬真女聲（HsiaoYu Neural）",
        "en_label": "🔊 English Female Voice (Emma Neural)",
        "zh_intro": "大家好，我是旅館管理系專案助理教授，盧小琴。我的研究與教學專長涵蓋餐飲管理、消費者行為、觀光發展、餐旅教育與餐旅產業管理！",
        "en_intro": "Hello everyone! I am Dr. Jamie Lo, Project Assistant Professor in the Department of Hotel Management. My expertise covers food and beverage management, consumer behavior, tourism development, hospitality education, and hospitality industry management.",
    },
}


def zh(v):
    return v if isinstance(v, str) else (v or {}).get("zh") or ""


def en(v):
    return v if isinstance(v, str) else (v or {}).get("en") or zh(v)


def policies(data):
    total_islands = len(data.get("islands") or [])
    total_items = sum(len(i.get("buildings") or []) for i in (data.get("islands") or []))
    sources_map = {s["id"]: s for s in data.get("sources") or []}
    for isl in data["islands"]:
        siblings = [(b["id"], zh(b["name"]), en(b["name"])) for b in isl["buildings"]]
        for b in isl["buildings"]:
            phase = b.get("phase") or {}
            b_sources = []
            for sid in b.get("sources") or []:
                s = sources_map.get(sid)
                if s and s.get("url"):
                    b_sources.append({
                        "id": sid,
                        "title": zh(s.get("title")) or sid,
                        "title_en": en(s.get("title")) or zh(s.get("title")) or sid,
                        "url": s["url"],
                    })
            if not b_sources and isl.get("url"):
                b_sources.append({
                    "id": isl["id"],
                    "title": f"{zh(isl['name'])}官方網頁",
                    "title_en": f"{en(isl['name'])} Official Page",
                    "url": isl["url"],
                })
            yield {
                "id": b["id"],
                "name": zh(b["name"]),
                "name_en": en(b["name"]),
                "desc": zh(b.get("plain")),
                "desc_en": en(b.get("plain")),
                "who": zh(b.get("who")),
                "who_en": en(b.get("who")),
                "status": zh(b.get("status")) or "系所亮點",
                "status_en": en(b.get("status")) or "Department Highlight",
                "facts": [(zh(f), en(f)) for f in (b.get("facts") or []) if zh(f)],
                "island_id": isl["id"],
                "island_num": f'{isl["number"]:02d}',
                "island": f'{isl["number"]:02d} {zh(isl["name"])}',
                "island_en": f'{isl["number"]:02d} {en(isl["name"])}',
                "island_name": zh(isl["name"]),
                "island_name_en": en(isl["name"]),
                "island_summary": zh(isl.get("summary")),
                "island_summary_en": en(isl.get("summary")),
                "heart": [h for h in isl.get("heart") or [] if h in HEART],
                "when": zh(phase.get("label")) or ("" if phase.get("stages") else "系所核心與制度"),
                "when_en": en(phase.get("label")) or ("" if phase.get("stages") else "Core Program & System"),
                "sources": b_sources,
                "siblings": siblings,
                "photo": TEACHER_PHOTOS.get(b["id"]),
                "voice": TEACHER_VOICES.get(b["id"]),
                "teacher_id": TEACHER_IDS.get(b["id"]) or "",
                "total_islands": total_islands,
                "total_items": total_items,
            }


def page(p, fresh):
    e = lambda s: html.escape(str(s or ""), quote=True)
    url = f"{SITE}p/{p['id']}/"
    image = f"{SITE}assets/share/{p['id']}.png?v={p['hash'][:8]}" if fresh else OG_IMAGE
    title = f"{p['name']}｜高餐大旅館管理系 島嶼導覽器"
    desc = p["desc"] or f"{p['island']}重點項目，依四年學習期程與能力階段整理。"
    target_3d = f"../../?focus={p['id']}"
    target_2d = f"../../timeline.html?p={p['id']}"
    target_island_3d = f"../../?focus={p['island_id']}"

    heart_badges = "".join(
        f'<span class="sp-pill" style="background:{readable(HEART[h][2])};color:#fff" '
        f'data-zh="✦ NKUHT · {e(HEART[h][0])}" data-en="✦ NKUHT · {e(HEART[h][1])}">✦ NKUHT · {e(HEART[h][0])}</span>'
        for h in p["heart"]
    )
    facts_html = "".join(
        f'<li data-zh="{e(f_zh)}" data-en="{e(f_en)}">{e(f_zh)}</li>'
        for f_zh, f_en in p["facts"]
    )
    sources_html = "".join(
        f'<a class="sp-source-btn" href="{e(s["url"])}" target="_blank" rel="noopener noreferrer">'
        f'<span class="sp-src-ico" data-zh="{"📄 PDF" if s["url"].lower().endswith(".pdf") else "🌐 官網網頁"}" '
        f'data-en="{"📄 PDF" if s["url"].lower().endswith(".pdf") else "🌐 Official Web"}">{"📄 PDF" if s["url"].lower().endswith(".pdf") else "🌐 官網網頁"}</span>'
        f'<span class="sp-src-txt"><b data-zh="{e(s["title"])}" data-en="{e(s["title_en"])}">{e(s["title"])}</b><small>{e(s["url"])}</small></span>'
        f'<span class="sp-src-arr" data-zh="開啟真實頁面 ↗" data-en="Open Official Page ↗">開啟真實頁面 ↗</span></a>'
        for s in p["sources"]
    )
    pdf_sources = [s for s in p["sources"] if s["url"].lower().endswith(".pdf")]
    pdf_embed_html = ""
    if pdf_sources:
        first_pdf = pdf_sources[0]
        pdf_embed_html = f"""
        <section class="sp-section">
          <h2 data-zh="📄 官方原始文件線上預覽（{e(first_pdf["title"])}）" data-en="📄 Official Document Inline Preview ({e(first_pdf["title_en"])})">📄 官方原始文件線上預覽（{e(first_pdf["title"])}）</h2>
          <div class="sp-pdf-wrap">
            <iframe src="{e(first_pdf["url"])}" title="{e(first_pdf["title"])}" loading="lazy"></iframe>
          </div>
          <p class="sp-pdf-note" data-zh="若瀏覽器未自動顯示 PDF，請點擊上方連結直接於新分頁開啟官方檔案。" data-en="If your browser does not display the inline PDF, click the official link above to open it in a new tab.">若瀏覽器未自動顯示 PDF，請點擊上方「<a href="{e(first_pdf["url"])}" target="_blank" rel="noopener noreferrer">{e(first_pdf["title"])} ↗</a>」直接於新分頁開啟官方檔案。</p>
        </section>"""

    siblings_html = "".join(
        f'<a class="sp-sib{" active" if sid == p["id"] else ""}" href="../{e(sid)}/" data-zh="{e(sname)}" data-en="{e(sname_en)}">{e(sname)}</a>'
        for sid, sname, sname_en in p["siblings"]
    )
    photo_html = (
        f'<img class="sp-teacher-photo" src="{e(p["photo"])}" alt="{e(p["name"])}">'
        if p.get("photo")
        else ""
    )
    v = p.get("voice")
    voice_html = ""
    if v:
        voice_html = f"""<div class="sp-voice-box" id="sp-voice-box">
          <div class="sp-vb-head">
            <b data-zh="🎙️ 師長擬真人聲導覽（中／英文切換）" data-en="🎙️ Lifelike Neural Voice Guide (Chinese / English)">🎙️ 師長擬真人聲導覽（中／英文切換）</b>
            <div class="sp-vb-btns">
              <button type="button" class="sp-vb-btn active" data-sp-vlang="zh">{e(v["zh_label"])}</button>
              <button type="button" class="sp-vb-btn" data-sp-vlang="en">{e(v["en_label"])}</button>
            </div>
          </div>
          <p class="sp-vb-intro" id="sp-vb-intro" data-zh="「{e(v["zh_intro"])}」" data-en="“{e(v["en_intro"])}”">「{e(v["zh_intro"])}」</p>
          <audio id="sp-vb-audio" controls preload="none" src="{e(v["zh_mp3"])}" data-src-zh="{e(v["zh_mp3"])}" data-src-en="{e(v["en_mp3"])}"></audio>
        </div>"""

    return f"""<!doctype html>
<!-- Generated by scripts/share_pages.py: standalone bilingual data & share page for one item. -->
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="zh_TW">
<meta property="og:site_name" content="高餐大旅館管理系 島嶼導覽器">
<meta property="og:title" content="{e(p['name'])}｜國立高雄餐旅大學旅館管理系">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(p['island'])}：{e(p['name'])}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../../assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="../../assets/nkuht_htl_logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap">
<style>
  :root {{
    --bg: #fff8f4;
    --card: #ffffff;
    --ink: #211d1d;
    --muted: #5f5855;
    --line: #e6d7c8;
    --gold: #e5a922;
    --gold-soft: #fdf3d7;
    --coral: #db6a41;
    --coral-ink: {readable("#db6a41", "#fff8f4")};
    --teal: #3e7c8c;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
    line-height: 1.65;
  }}
  .nw {{ display: inline-block; white-space: nowrap; }}
  h1, h2, h3, .sp-brand-txt strong, .sp-btn {{ word-break: keep-all; overflow-wrap: break-word; }}
  .sp-top {{
    background: linear-gradient(135deg, #211d1d 0%, #342c28 100%);
    color: #fff;
    border-bottom: 5px solid var(--gold);
    padding: 18px 20px;
  }}
  .sp-top-inner {{
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }}
  .sp-brand {{
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: #fff;
  }}
  .sp-brand img {{
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: transparent;
    padding: 2px;
    object-fit: contain;
  }}
  .sp-brand-txt small {{
    display: block;
    color: #f5d33a;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
  }}
  .sp-brand-txt strong {{
    font-size: 17px;
    font-weight: 900;
  }}
  .sp-nav {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }}
  .sp-btn {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 999px;
    text-decoration: none;
    font: inherit;
    font-size: 13.5px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .15s ease, box-shadow .15s ease;
  }}
  .sp-btn:hover {{ transform: translateY(-1px); }}
  .sp-btn.primary {{ background: #f5d33a; color: #211d1d; box-shadow: 0 3px 10px rgba(0,0,0,.22); border: none; }}
  .sp-btn.secondary {{ background: rgba(255,255,255,.14); color: #fff; border: 1px solid rgba(255,255,255,.28); }}
  .sp-btn.lang {{ background: #211d1d; color: #f5d33a; border: 1.5px solid #f5d33a; }}
  .sp-main {{
    max-width: 960px;
    margin: 26px auto 48px;
    padding: 0 18px;
  }}
  .sp-crumb {{
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 14px;
  }}
  .sp-crumb a {{ color: var(--coral-ink); text-decoration: none; font-weight: 700; }}
  .sp-card {{
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 22px;
    padding: 28px 28px 32px;
    box-shadow: 0 10px 30px rgba(33, 29, 29, .06);
  }}
  .sp-head {{
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }}
  .sp-teacher-photo {{
    width: 104px;
    height: 156px;
    aspect-ratio: 2 / 3;
    border-radius: 18px;
    object-fit: contain;
    object-position: center bottom;
    border: 3px solid var(--gold);
    flex-shrink: 0;
    background: #f5efe6;
  }}
  .sp-pills {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }}
  .sp-pill {{
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 800;
    background: var(--gold-soft);
    color: #5b4100;
  }}
  .sp-pill.isl {{ background: #211d1d; color: #f5d33a; }}
  h1 {{
    margin: 4px 0 6px;
    font-size: clamp(24px, 3.6vw, 34px);
    font-weight: 900;
    line-height: 1.25;
    color: var(--ink);
  }}
  .sp-en {{
    margin: 0 0 12px;
    font-size: 14px;
    color: var(--muted);
    font-weight: 600;
  }}
  .sp-desc {{
    font-size: 16.5px;
    font-weight: 700;
    color: #2c2623;
    background: #fdf8ef;
    border-left: 4px solid var(--gold);
    padding: 14px 18px;
    border-radius: 0 12px 12px 0;
    margin: 16px 0;
  }}
  .sp-meta-row {{
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 14px 0 20px;
  }}
  .sp-meta-box {{
    flex: 1 1 220px;
    background: #faf5ef;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px 16px;
  }}
  .sp-meta-box small {{
    display: block;
    font-size: 12px;
    color: var(--muted);
    font-weight: 700;
  }}
  .sp-meta-box b {{
    font-size: 15px;
    color: var(--ink);
  }}
  .sp-section {{
    margin-top: 26px;
    padding-top: 22px;
    border-top: 1px solid var(--line);
  }}
  .sp-voice-box {{
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #fdf3d7;
    border: 1.5px solid #e5a922;
    border-radius: 14px;
    padding: 14px 16px;
    margin: 14px 0 18px;
  }}
  .sp-vb-head {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }}
  .sp-voice-box b {{
    font-size: 14.5px;
    color: #5b4100;
  }}
  .sp-vb-btns {{
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }}
  .sp-vb-btn {{
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid #d4952a; background: #fff;
    background: transparent;
    color: #211d1d;
    font: inherit;
    font-size: 12.5px;
    font-weight: 800;
    cursor: pointer;
  }}
  .sp-vb-btn.active,
  .sp-vb-btn:hover {{
    background: #211d1d;
    color: #f5d33a;
    border-color: #211d1d;
  }}
  .sp-vb-intro {{
    margin: 0;
    font-size: 14px;
    color: #2b2523;
    line-height: 1.6;
  }}
  .sp-voice-box audio {{
    height: 38px;
    width: 100%;
  }}
  .sp-section h2 {{
    margin: 0 0 14px;
    font-size: 18px;
    font-weight: 900;
    color: var(--ink);
  }}
  .sp-facts {{
    margin: 0;
    padding-left: 22px;
  }}
  .sp-facts li {{
    margin-bottom: 10px;
    font-size: 15.5px;
    font-weight: 500;
  }}
  .sp-sources {{
    display: grid;
    gap: 10px;
  }}
  .sp-source-btn {{
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1.5px solid #d9c8b4;
    background: #fffdf9;
    text-decoration: none;
    color: var(--ink);
    transition: border-color .15s ease, background .15s ease, transform .15s ease;
  }}
  .sp-source-btn:hover {{
    border-color: var(--coral);
    background: #fff6f0;
    transform: translateY(-1px);
  }}
  .sp-src-ico {{
    padding: 6px 10px;
    border-radius: 10px;
    background: var(--gold-soft);
    color: #5b4100;
    font-size: 12.5px;
    font-weight: 900;
    white-space: nowrap;
  }}
  .sp-src-txt {{
    flex: 1;
    min-width: 0;
  }}
  .sp-src-txt b {{
    display: block;
    font-size: 15px;
    font-weight: 800;
  }}
  .sp-src-txt small {{
    display: block;
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }}
  .sp-src-arr {{
    font-size: 13px;
    font-weight: 800;
    color: var(--coral-ink);
    white-space: nowrap;
  }}
  .sp-pdf-wrap {{
    width: 100%;
    height: 620px;
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
    background: #f3efe9;
  }}
  .sp-pdf-wrap iframe {{
    width: 100%;
    height: 100%;
    border: 0;
  }}
  .sp-pdf-note {{
    font-size: 13px;
    color: var(--muted);
    margin: 8px 0 0;
  }}
  .sp-sibs {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }}
  .sp-sib {{
    padding: 7px 13px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #faf5ef;
    color: var(--ink);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }}
  .sp-sib.active {{
    background: var(--ink);
    color: #f5d33a;
    border-color: var(--ink);
  }}
  .sp-foot {{
    margin-top: 28px;
    text-align: center;
    font-size: 13px;
    color: var(--muted);
  }}
  .sp-foot a {{ color: var(--coral-ink); font-weight: 700; text-decoration: none; }}
  .sp-passport-bar {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 14px;
    background: linear-gradient(145deg, #0d1d19 0%, #162c26 100%);
    border: 1.5px solid #c6a15b;
    color: #f8f3e6;
    font-size: 13.5px;
    box-shadow: 0 8px 22px rgba(10, 20, 17, 0.12);
  }}
  .sp-pb-left {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }}
  .sp-pb-badge {{
    padding: 4px 10px;
    border-radius: 7px;
    background: linear-gradient(135deg, #ebd094 0%, #c49b4d 100%);
    color: #0b1614;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }}
  .sp-pb-stars {{
    color: #f5d33a;
    font-weight: 800;
  }}
  .sp-pb-open {{
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 13px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ebd094 0%, #c6a15b 100%);
    color: #0b1614;
    font-size: 12.5px;
    font-weight: 800;
    text-decoration: none;
  }}
  @media (max-width: 640px) {{
    .sp-card {{ padding: 20px 18px; }}
    .sp-head {{ flex-direction: column; }}
    .sp-pdf-wrap {{ height: 420px; }}
  }}
</style>
</head>
<body>
<header class="sp-top">
  <div class="sp-top-inner">
    <a class="sp-brand" id="sp-home-brand" href="../../">
      <img src="../../assets/nkuht_htl_logo.png" alt="國立高雄餐旅大學旅館管理系系徽">
      <div class="sp-brand-txt">
        <small>NKUHT DEPARTMENT OF HOTEL MANAGEMENT · SINCE 1995</small>
        <strong data-zh="&lt;span class=&quot;nw&quot;&gt;國立高雄餐旅大學&lt;/span&gt;・&lt;span class=&quot;nw&quot;&gt;旅館管理系&lt;/span&gt; &lt;span class=&quot;nw&quot;&gt;島嶼導覽器&lt;/span&gt;" data-en="&lt;span class=&quot;nw&quot;&gt;NKUHT&lt;/span&gt; · &lt;span class=&quot;nw&quot;&gt;Dept. of Hotel Management&lt;/span&gt;"><span class="nw">國立高雄餐旅大學</span>・<span class="nw">旅館管理系</span> <span class="nw">島嶼導覽器</span></strong>
      </div>
    </a>
    <nav class="sp-nav" aria-label="快速切換視角">
      <a class="sp-btn primary" id="sp-btn-3d" href="{e(target_3d)}" data-zh="✦ 在 3D 旅館島中開啟此項 ↗" data-en="✦ Open in 3D Hotel Island ↗">✦ 在 3D 旅館島中開啟此項 ↗</a>
      <a class="sp-btn secondary" id="sp-btn-2d" href="{e(target_2d)}" data-zh="◫ 在 2D 時間軸總覽開啟 ↗" data-en="◫ Open in 2D Timeline ↗">◫ 在 2D 時間軸總覽開啟 ↗</a>
      <button type="button" class="sp-btn lang" id="sp-lang-btn" title="切換中／英文介面與語音 (Switch Chinese / English)">🌐 EN / 中文</button>
    </nav>
  </div>
</header>

<main class="sp-main">
  <div class="sp-crumb">
    <a id="sp-crumb-home" href="../../" data-zh="3D 旅館島首頁" data-en="3D Island Home">3D 旅館島首頁</a> ／ <a id="sp-crumb-isl" href="{e(target_island_3d)}" data-zh="{e(p['island'])}" data-en="{e(p['island_en'])}">{e(p['island'])}</a> ／ <span data-zh="{e(p['name'])}" data-en="{e(p['name_en'])}">{e(p['name'])}</span>
  </div>

  <div class="sp-passport-bar" id="sp-passport-bar" aria-live="polite"></div>
  <article class="sp-card">
    <div class="sp-head">
      {photo_html}
      <div style="flex:1;min-width:0">
        <div class="sp-pills">
          <span class="sp-pill isl" data-zh="{e(p['island'])}" data-en="{e(p['island_en'])}">{e(p['island'])}</span>
          <span class="sp-pill" data-zh="{e(p['status'])}" data-en="{e(p['status_en'])}">{e(p['status'])}</span>
          {heart_badges}
        </div>
        <h1 data-zh="{e(p['name'])}" data-en="{e(p['name_en'])}">{e(p['name'])}</h1>
        {f'<p class="sp-en" data-zh="{e(p["name_en"])}" data-en="{e(p["name"])}">{e(p["name_en"])}</p>' if p.get("name_en") else ""}
      </div>
    </div>

    {f'<div class="sp-desc" data-zh="{e(p["desc"])}" data-en="{e(p["desc_en"])}">{e(p["desc"])}</div>' if p.get("desc") else ""}
    {voice_html}

    <div class="sp-meta-row">
      {f'<div class="sp-meta-box"><small data-zh="適用對象／分類" data-en="Target / Category">適用對象／分類</small><b data-zh="{e(p["who"])}" data-en="{e(p["who_en"])}">{e(p["who"])}</b></div>' if p.get("who") else ""}
      {f'<div class="sp-meta-box"><small data-zh="四年三明治培育期程" data-en="4-Year Sandwich Stage">四年三明治培育期程</small><b data-zh="{e(p["when"])}" data-en="{e(p["when_en"])}">{e(p["when"])}</b></div>' if p.get("when") else ""}
      <div class="sp-meta-box"><small data-zh="所屬主題島嶼" data-en="Theme Island">所屬主題島嶼</small><b data-zh="{e(p['island'])}" data-en="{e(p['island_en'])}">{e(p['island'])}</b></div>
    </div>

    <section class="sp-section">
      <h2 data-zh="📌 重點與真實資料明細（依官網公開資料整理）" data-en="📌 Key Facts &amp; Official Details">📌 重點與真實資料明細（依官網公開資料整理）</h2>
      <ul class="sp-facts">
        {facts_html}
      </ul>
    </section>

    <section class="sp-section">
      <h2 data-zh="🔗 官方網站真實資料頁面與原始文件連結（點擊開啟新分頁）" data-en="🔗 Official Web Pages &amp; Source Documents">🔗 官方網站真實資料頁面與原始文件連結（點擊開啟新分頁）</h2>
      <div class="sp-sources">
        {sources_html}
      </div>
    </section>

    {pdf_embed_html}

    <section class="sp-section">
      <h2 data-zh="🧭 同主題島嶼（{e(p['island'])}）其他細項" data-en="🧭 Other Items on {e(p['island_en'])}">🧭 同主題島嶼（{e(p['island'])}）其他細項</h2>
      <div class="sp-sibs">
        {siblings_html}
      </div>
    </section>
  </article>

  <footer class="sp-foot">
    <p data-zh="資料來源：&lt;a href=&quot;https://hotel.nkuht.edu.tw/?Lang=zh-tw&quot; target=&quot;_blank&quot; rel=&quot;noopener&quot;&gt;國立高雄餐旅大學旅館管理系官方網站&lt;/a&gt; ＆ &lt;a href=&quot;https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw&quot; target=&quot;_blank&quot; rel=&quot;noopener&quot;&gt;餐旅學院師資頁&lt;/a&gt; · 812301 高雄市小港區松和路一號，第一教學大樓(F棟)1樓 · 07-8060505 轉 20202、20201" data-en="Source: &lt;a href=&quot;https://hotel.nkuht.edu.tw/?Lang=zh-tw&quot; target=&quot;_blank&quot; rel=&quot;noopener&quot;&gt;NKUHT Dept. of Hotel Management Official Website&lt;/a&gt; &amp; &lt;a href=&quot;https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw&quot; target=&quot;_blank&quot; rel=&quot;noopener&quot;&gt;College of Hospitality Faculty Page&lt;/a&gt; · 1F, Teaching Bldg I (F), No. 1, Songhe Rd., Xiaogang Dist., Kaohsiung 812301, Taiwan">資料來源：<a href="https://hotel.nkuht.edu.tw/?Lang=zh-tw" target="_blank" rel="noopener">國立高雄餐旅大學旅館管理系官方網站</a> ＆ <a href="https://shm.nkuht.edu.tw/p/412-1016-854.php?Lang=zh-tw" target="_blank" rel="noopener">餐旅學院師資頁</a> · 812301 高雄市小港區松和路一號，第一教學大樓(F棟)1樓 · 07-8060505 轉 20202、20201</p>
  </footer>
</main>
<script type="application/json" id="sp-data">{sp_data_json(p, target_3d, target_2d, target_island_3d)}</script>
<script src="../../assets/share-page.js?v=20261113-01" defer></script>
</body>
</html>
"""



def sp_data_json(p, target_3d, target_2d, target_island_3d):
    """Per-page values for assets/share-page.js, as JSON that is safe inside a <script type="application/json">."""
    data = {
        "t3d": target_3d, "t2d": target_2d, "tIsland": target_island_3d,
        "id": p["id"], "island": p["island_id"], "teacher": p.get("teacher_id") or "",
        "totalIslands": p.get("total_islands", 20), "totalItems": p.get("total_items", 113),
    }
    return json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def card(p):
    e = html.escape
    n = len(p["name"])
    size = 104 if n <= 7 else 92 if n <= 10 else 76
    wide = (sum(0.55 if ord(c) < 0x2E80 else 1 for c in p["name"]) + 1) * size > 1080
    when = f'<div class="when"><span>{e(p["when"])}</span></div>' if p["when"] else ""
    heart = "".join(f'<span style="background: {HEART[h][2]}">{h} {HEART[h][0]}</span>' for h in p["heart"])
    return f"""<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&display=block">
<style>
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; width: 1200px; height: 630px; overflow: hidden; }}
  body {{
    background: linear-gradient(135deg, #003c30 0%, #005a47 100%);
    color: #f7f4eb;
    font-family: "Noto Sans TC", "Noto Sans CJK TC", "PingFang TC", sans-serif;
    padding: 44px 60px;
    display: flex;
    flex-direction: column;
    border-bottom: 10px solid #c5a659;
  }}
  .top {{ display: flex; justify-content: space-between; align-items: center; gap: 20px; }}
  .island {{
    font-size: 30px;
    font-weight: 900;
    color: #182421;
    background: #f7df8b;
    padding: 8px 24px;
    border-radius: 999px;
  }}
  .heart {{ display: flex; gap: 10px; }}
  .heart span {{
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    padding: 8px 18px;
    border-radius: 999px;
  }}
  .mid {{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    min-height: 0;
  }}
  h1 {{
    margin: 0;
    font-size: {size}px;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -.01em;
    color: #ffffff;
    {"display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" if wide else ""}
  }}
  .desc {{
    margin: 0;
    font-size: 34px;
    font-weight: 500;
    line-height: 1.4;
    color: #f0ece1;
    display: -webkit-box;
    -webkit-line-clamp: {1 if wide else 2};
    -webkit-box-orient: vertical;
    overflow: hidden;
  }}
  .when {{ display: flex; }}
  .when span {{
    font-size: 26px;
    font-weight: 700;
    color: #f7df8b;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(247, 223, 139, 0.55);
    padding: 6px 20px;
    border-radius: 8px;
  }}
  .foot {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 16px;
    border-top: 2px solid rgba(247, 223, 139, 0.35);
    font-size: 26px;
    font-weight: 700;
    color: #f7df8b;
  }}
  .foot .url {{ font-size: 22px; font-weight: 500; color: #d6ceb8; }}
</style>
</head>
<body>
  <div class="top">
    <span class="island">{e(p["island"])}</span>
    <span class="heart">{heart}</span>
  </div>
  <div class="mid">
    <h1>{e(p["name"])}</h1>
    {f'<p class="desc">{e(p["desc"])}</p>' if p["desc"] else ""}
    {when}
  </div>
  <div class="foot">
    <span>國立高雄餐旅大學 旅館管理系｜學習與職涯島嶼導覽器</span>
    <span class="url">hotel.nkuht.edu.tw</span>
  </div>
</body>
</html>
"""


def card_hash(p):
    payload = {k: p[k] for k in ("id", "name", "desc", "island", "heart", "when")}
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]


def find_chrome():
    env = os.environ.get("CHROME")
    for c in ([env] if env else []) + CHROMES:
        path = shutil.which(c) or (c if os.path.isfile(c) else None)
        if path:
            return path
    sys.exit("No Chrome/Chromium found; set CHROME=/path/to/chrome")


def render_one(args):
    chrome, p, tmp = args
    html_file = tmp / f"{p['id']}.html"
    out_file = SHARE / f"{p['id']}.png"
    html_file.write_text(card(p), encoding="utf-8")
    subprocess.run(
        [
            chrome,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--hide-scrollbars",
            "--window-size=1200,630",
            "--force-device-scale-factor=1",
            "--virtual-time-budget=2000",
            f"--screenshot={out_file}",
            html_file.as_uri(),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return p["id"], p["hash"]


def main():
    render_images = "--images" in sys.argv
    data = json.loads((ROOT / "data/policies.json").read_text(encoding="utf-8"))
    items = list(policies(data))
    for p in items:
        p["hash"] = card_hash(p)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.is_file() else {}
    stale = [p for p in items if manifest.get(p["id"]) != p["hash"] or not (SHARE / f"{p['id']}.png").is_file()]

    if render_images and stale:
        chrome = find_chrome()
        SHARE.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            with ThreadPoolExecutor(max_workers=min(4, os.cpu_count() or 2)) as ex:
                for pid, h in ex.map(render_one, [(chrome, p, tmp_path) for p in stale]):
                    manifest[pid] = h
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(f"share_pages: rendered {len(stale)}/{len(items)} preview image(s) → assets/share/")
    elif stale:
        print(f"share_pages: {len(stale)} previews need rendering (python3 scripts/share_pages.py --images); they use assets/og.png")

    if OUT.exists():
        shutil.rmtree(OUT)
    for p in items:
        fresh = manifest.get(p["id"]) == p["hash"] and (SHARE / f"{p['id']}.png").is_file()
        d = OUT / p["id"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(p, fresh), encoding="utf-8")
    print(f"share_pages: {len(items)} pages → p/")


if __name__ == "__main__":
    main()
