from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "data",
    "playwright-report",
    "test-results",
}
LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "data"}


def markdown_files() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*.md")
        if not any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts)
    )


def destination(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<") and ">" in value:
        return value[1 : value.index(">")].strip()
    # Markdown permits an optional quoted title after the destination.
    match = re.match(r"^(\S+)(?:\s+[\"'].*[\"'])?$", value)
    return match.group(1) if match else value


def check_link(source: Path, raw: str) -> str | None:
    target = destination(raw)
    if not target or target.startswith("#"):
        return None

    parsed = urlsplit(target)
    if parsed.scheme.lower() in EXTERNAL_SCHEMES or target.startswith("//"):
        return None

    path_text = unquote(parsed.path)
    if not path_text:
        return None

    if path_text.startswith("/"):
        resolved = (ROOT / path_text.lstrip("/")).resolve()
    else:
        resolved = (source.parent / path_text).resolve()

    try:
        resolved.relative_to(ROOT.resolve())
    except ValueError:
        return f"target escapes repository: {target}"

    if not resolved.exists():
        return f"missing target: {target}"
    return None


def main() -> int:
    problems: list[str] = []
    checked = 0
    files = markdown_files()
    for source in files:
        text = source.read_text(encoding="utf-8")
        for line_number, line in enumerate(text.splitlines(), 1):
            for match in LINK_RE.finditer(line):
                checked += 1
                problem = check_link(source, match.group(1))
                if problem:
                    problems.append(
                        f"{source.relative_to(ROOT)}:{line_number}: {problem}"
                    )

    if problems:
        print("Broken local Markdown links:")
        for problem in problems:
            print(f"- {problem}")
        return 1

    print(f"Markdown links OK: {checked} links checked across {len(files)} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
