<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## BlablaCAMG

- Follow the project schema and business rules in `../agents.md` exactly.
- Use Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth and RLS.
- Do not add database tables or columns without explicit approval.
- Keep the Supabase service role key and n8n webhook URL on the server only.
- All users, including passengers, must authenticate before using ride data or the assistant.
- Call n8n through `/api/assistente` using server-only `N8N_WEBHOOK_URL`; do not use `VITE_N8N_WEBHOOK_URL` or expose the n8n URL in the browser.
