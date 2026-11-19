#!/usr/bin/env bash
# Kept for muscle memory / CI: the watcher is now scripts/docs-watch.mjs (official docs are Markdown since v2.0.0).
exec node "$(dirname "$0")/docs-watch.mjs" "$@"
