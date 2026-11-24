"""Small avatar thumbnails for the faculty photos (assets/teachers/*.jpg|png → assets/teachers/thumb/*.webp).

The 3D name tags, faculty roster and chips show the photos at 20–48 CSS px, but used to download the full
320×480 originals (130–240 KB each, all ten at start-up). The thumbnails are 160 px wide (sharp up to 3× DPR
at ~53 px) and the large teacher card keeps the original photo.

Usage: python scripts/make_thumbs.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "teachers"
OUT = SRC / "thumb"
WIDTH = 160


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for src in sorted(SRC.iterdir()):
        if src.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        im = Image.open(src)
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        w = min(WIDTH, im.width)
        h = round(im.height * w / im.width)
        im = im.resize((w, h), Image.LANCZOS)
        dst = OUT / (src.stem + ".webp")
        im.save(dst, "WEBP", quality=84, method=6)
        print(f"{src.name}: {src.stat().st_size // 1024} KB → {dst.name}: {dst.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
