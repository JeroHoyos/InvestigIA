def parse_markdown_table(markdown: str) -> list[list[str]]:
    rows = []
    for line in markdown.split("\n"):
        line = line.strip()
        if line.startswith("|") and line.endswith("|") and "---" not in line:
            cells = [c.strip() for c in line[1:-1].split("|")]
            rows.append(cells)
    return rows
