#!/usr/bin/env python3
"""Generate sitemap.xml for https://nkuht-htl.drmjhsu.com/ from policies.json."""

from __future__ import annotations
import json
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://nkuht-htl.drmjhsu.com"


def main() -> None:
    pol = json.loads((ROOT / "policies.json").read_text(encoding="utf-8"))
    today = date.today().isoformat()
    urls: list[tuple[str, str]] = [
        (f"{BASE}/", "1.0"),
        (f"{BASE}/timeline.html", "0.9"),
    ]
    seen: set[str] = set()
    for isl in pol.get("islands", []):
        for b in isl.get("buildings", []):
            bid = b["id"]
            if bid in seen:
                continue
            seen.add(bid)
            if (ROOT / "p" / bid / "index.html").exists():
                urls.append((f"{BASE}/p/{bid}/", "0.7"))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, prio in urls:
        lines.append(
            f"  <url><loc>{escape(loc)}</loc><lastmod>{today}</lastmod><priority>{prio}</priority></url>"
        )
    lines.append("</urlset>\n")
    (ROOT / "sitemap.xml").write_text("\n".join(lines), encoding="utf-8")
    print(f"sitemap.xml: {len(urls)} URLs written.")


if __name__ == "__main__":
    main()
