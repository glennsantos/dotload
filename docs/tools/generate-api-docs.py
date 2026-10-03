#!/usr/bin/env python3
"""Generate a route inventory from exported Next.js handler declarations."""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[2]
HANDLER = re.compile(
    r"^export\s+(?:async\s+)?function\s+"
    r"(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(",
    re.MULTILINE,
)


def render() -> str:
    lines = [
        "# API route inventory",
        "",
        "Generated from `app/api/**/route.ts` by "
        "[generate-api-docs.py](tools/generate-api-docs.py).",
        "",
        "Run `python3 docs/tools/generate-api-docs.py` from the repository root "
        "after changing routes. Only exported function declarations are listed. "
        "Implicit framework methods are not included.",
        "",
        "Dynamic segments retain Next.js notation: `[id]` is one segment, "
        "and `[...path]` is a catch-all. Read the linked handler for body fields, "
        "responses, and authorization. This inventory does not guarantee that "
        "an endpoint is publicly accessible or production-ready.",
        "",
        "[Middleware](../middleware.ts) matches only selected paths. "
        "Other handlers perform their own authentication checks. "
        "Diagnostic routes beginning with `/api/test-` also exist; "
        "review them before exposing a deployment.",
        "",
        "| Route | Exported methods | Handler |",
        "| --- | --- | --- |",
    ]
    for source in sorted((ROOT / "app/api").rglob("route.ts")):
        methods = HANDLER.findall(source.read_text())
        if not methods:
            raise ValueError(f"No supported handler declarations found in {source}")
        relative = source.relative_to(ROOT).as_posix()
        route = "/" + source.parent.relative_to(ROOT / "app").as_posix()
        formatted = ", ".join(f"`{method}`" for method in methods)
        lines.append(f"| `{route}` | {formatted} | [source](../{relative}) |")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    target = ROOT / "docs/api.md"
    target.write_text(render())
    print(f"Generated {target.relative_to(ROOT)}")
