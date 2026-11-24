#!/usr/bin/env python3
"""Re-check the "World's Top 2% Scientists" lists (Elsevier / Stanford, Ioannidis et al.) for this university
and write the result to data/research.json → "top2".

    python scripts/research_top2.py            # update data/research.json
    python scripts/research_top2.py --check    # compare only; exit 10 when the result changed

Source: Mendeley Data dataset 10.17632/btchxktzyw (one version per yearly update). For every version listed in
VERSIONS both "Table_1 ... career" and "Table_1 ... singleyr" workbooks are downloaded (≈80–100 MB each, read in
memory, nothing is saved) and every row whose institution is National Kaohsiung University of Hospitality and
Tourism is recorded.  A row is linked to one of our 10 teachers only through ENGLISH_NAMES below; the official
faculty pages give no English names, so each entry there states why the match was made.
"""
import io
import json
import re
import subprocess
import sys
import zipfile
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "data" / "research.json"
DATASET = "btchxktzyw"
API = f"https://data.mendeley.com/public-api/datasets/{DATASET}"
VERSIONS = [3, 5, 6, 7, 8, 9]  # v4 is a re-issue of the 2022 update (v5 replaces it); v1–v2 predate 2020
INSTITUTION = re.compile(r"Kaohsiung (?:University of )?Hosp|NKUHT", re.I)

# Scopus author name → teacher (data/official.json).  Keep the reason so a reviewer can check it.
ENGLISH_NAMES = {
    "Yang, Jen Te": {
        "teacher": "楊仁德",
        "matchedBy": "same institution (NKUHT); publications 2004–2015 in hospitality management; GRB lists 楊仁德 "
                     "(國立高雄餐旅大學旅館管理系) as PI of MOST hospitality-organisation research in the same period",
    },
}


def curl(url):
    # curl follows the S3 redirect of Mendeley's download links and honours HTTPS_PROXY
    return subprocess.run(["curl", "-sSfL", "-m", "900", url], check=True, capture_output=True).stdout


def rows_for(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        sx = z.read("xl/sharedStrings.xml").decode("utf-8")
        shared = [unescape(re.sub(r"<[^>]+>", "", m)) for m in re.findall(r"<si>(.*?)</si>", sx, re.S)]
    for name in z.namelist():
        if "worksheets/sheet" not in name:
            continue
        x = z.read(name).decode("utf-8", "replace")
        for row in re.findall(r"<row[^>]*>(.*?)</row>", x, re.S):
            vals = []
            for attrs, inner in re.findall(r"<c ([^>]*?)(?:/>|>(.*?)</c>)", row, re.S):
                v = re.search(r"<v>([^<]*)</v>", inner or "")
                t = re.search(r"<t[^>]*>([^<]*)</t>", inner or "")
                if 't="s"' in attrs and v:
                    vals.append(shared[int(v.group(1))])
                elif t:
                    vals.append(unescape(t.group(1)))
                elif v:
                    vals.append(v.group(1))
                else:
                    vals.append("")
            if len(vals) > 1 and INSTITUTION.search(vals[1]):
                yield vals


def capture():
    out = []
    for ver in VERSIONS:
        meta = json.loads(curl(f"{API}?version={ver}"))
        files = json.loads(curl(f"{API}/files?folder_id=root&version={ver}"))
        entry = {"version": ver, "doi": meta["doi"]["id"], "title": meta["name"],
                 "published": meta.get("publish_date", "")[:10], "career": [], "singleYear": []}
        for f in files:
            fn = f["filename"]
            if not fn.startswith("Table_1_Authors_"):
                continue
            key = "career" if "_career_" in fn else "singleYear" if "_singleyr_" in fn else None
            if not key:
                continue
            # only rows of our own teachers are stored; other NKUHT authors are counted, not named
            entry[key + "UniversityCount"] = 0
            for vals in rows_for(curl(f["content_details"]["download_url"])):
                entry[key + "UniversityCount"] += 1
                if vals[0] in ENGLISH_NAMES:
                    entry[key].append({"author": vals[0], "institution": vals[1], "teacher": ENGLISH_NAMES[vals[0]]["teacher"]})
            entry[key].sort(key=lambda h: h["author"])
        print(f"v{ver} ({entry['published']}): NKUHT career {entry['careerUniversityCount']}, single-year "
              f"{entry['singleYearUniversityCount']}; our teachers:", [h["teacher"] for h in entry["career"] + entry["singleYear"]])
        out.append(entry)
    return out


def main():
    versions = capture()
    research = json.loads(RESEARCH.read_text(encoding="utf-8")) if RESEARCH.exists() else {}
    new = {"source": f"https://doi.org/10.17632/{DATASET}", "englishNames": ENGLISH_NAMES, "versions": versions}
    if "--check" in sys.argv:
        same = research.get("top2", {}).get("versions") == versions
        print("top-2% lists unchanged" if same else "top-2% lists changed")
        sys.exit(0 if same else 10)
    research["top2"] = new
    RESEARCH.write_text(json.dumps(research, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("→ data/research.json")


if __name__ == "__main__":
    main()
