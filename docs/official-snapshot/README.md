# Official docs snapshot

Verbatim copy of the official Mengantar Public API documentation **v2.0.0**, taken from
<https://api-public.mengantar.com/docs/llms.txt> (one Markdown file per page, `en/` and `id/`).
It is a change detector and the reference this repo is checked against — quote the official site, not this copy.

- Check for updates: `make docs-watch` (exit 0 = same, 1 = changed, 2 = fetch failure; nothing is written on failure).
- After syncing `docs/`, `spec/`, `examples/`, `requests.http` and `CHANGELOG.md`: `node scripts/docs-watch.mjs --update`,
  then review `git diff docs/official-snapshot`.
- The sandbox host is compared too, as information only.

Before 2026-11-19 the snapshot was a text dump of the HTML page (`official-docs.txt`). The official site became a
JavaScript app with Markdown pages in v2.0.0, so that approach stopped working and was replaced.
