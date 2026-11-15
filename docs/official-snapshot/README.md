# Official docs snapshot

`official-docs.txt` is the text-normalized copy of <https://api-public.mengantar.com/docs/> (identical on
`app.` and `sandbox.` hosts) taken on 2026-11-14. It exists only as a change detector, not as a source to quote.

Check for updates: `make docs-watch` (exit 1 prints the diff). After syncing `docs/`, `spec/`, `examples/`,
`requests.http` and `CHANGELOG.md`, run `bash scripts/docs-watch.sh --update`.
