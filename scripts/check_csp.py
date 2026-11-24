#!/usr/bin/env python3
"""Check that the CSP script hashes in _headers match the inline <script>s in index.html / 404.html.

    python3 scripts/check_csp.py         exit 1 and list mismatches
    python3 scripts/check_csp.py --fix   rewrite the hashes in the /* rule of _headers

Why: Content-Security-Policy allows inline scripts only by sha256 hash. Editing the import map
or another inline script without updating _headers makes the browser block it, and the 3D page
stops loading. (ISO/IEC 27001:2022 Annex A 8.9 configuration management, 8.32 change management.)
"""
import base64
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "404.html", "timeline.html"]
HEADERS = ROOT / "_headers"
SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", re.S | re.I)


def inline_hashes():
    found = []
    for name in PAGES:
        path = ROOT / name
        if not path.exists():
            continue
        for m in SCRIPT_RE.finditer(path.read_text(encoding="utf-8")):
            attrs = m.group("attrs").lower()
            # External scripts and data blocks (JSON / JSON-LD) are not governed by script-src hashes.
            if "src=" in attrs or re.search(r'type="application/(ld\+)?json"', attrs):
                continue
            digest = base64.b64encode(hashlib.sha256(m.group("body").encode("utf-8")).digest()).decode()
            h = f"'sha256-{digest}'"
            if h not in found:
                found.append(h)
    return found


def main():
    want = inline_hashes()
    text = HEADERS.read_text(encoding="utf-8")
    # The first Content-Security-Policy line belongs to the /* rule.
    m = re.search(r"^(  Content-Security-Policy: .*?script-src 'self')((?: 'sha256-[^']+')*)(;.*)$", text, re.M)
    if not m:
        print("check_csp: no script-src 'self' … line found in _headers", file=sys.stderr)
        return 1
    have = re.findall(r"'sha256-[^']+'", m.group(2))
    if sorted(have) == sorted(want):
        print(f"check_csp: OK ({len(want)} inline script hash(es))")
        return 0
    if "--fix" in sys.argv:
        new_line = m.group(1) + "".join(" " + h for h in want) + m.group(3)
        HEADERS.write_text(text[: m.start()] + new_line + text[m.end():], encoding="utf-8")
        print(f"check_csp: updated _headers ({len(want)} hash(es))")
        return 0
    for h in sorted(set(want) - set(have)):
        print(f"check_csp: missing in _headers: {h}", file=sys.stderr)
    for h in sorted(set(have) - set(want)):
        print(f"check_csp: stale in _headers:   {h}", file=sys.stderr)
    print("check_csp: run python3 scripts/check_csp.py --fix", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
