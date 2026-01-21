from __future__ import annotations
import json
import pathlib

import yaml


def main() -> None:
    base = pathlib.Path("src/content")
    items = []
    for folder in ["posts", "pillars"]:
        for path in (base / folder).rglob("*.md"):
            text = path.read_text(encoding="utf-8")
            if not text.startswith("---"):
                continue
            parts = text.split("---", 2)
            if len(parts) < 3:
                continue
            front = yaml.safe_load(parts[1]) or {}
            front["__path"] = str(path)
            items.append(front)
    print(json.dumps(items, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
