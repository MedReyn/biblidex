<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Biblidex — Codex collaboration rules

- This is a Next.js 16 / TypeScript / Supabase book collection app. Preserve existing book search, ISBN scanning, authentication and social features.
- Work on a dedicated feature branch; open a pull request. Never push directly to protected or production branches or merge without user approval.
- Inspect the relevant code and existing tests before editing. Prefer small, reversible changes; do not silently remove existing functionality.
- Keep credentials in environment variables; never commit tokens, keys, or personal data. Do not run destructive database migrations or mutate production data.
- Use `npm ci` where a lockfile is available, then `npm run lint` and `npm run build`. Report failures accurately.
- Review responsive mobile UI and accessibility for user-facing changes.
- Summarize modified files, test evidence, risks and preview URL (if actually available) in each PR.
