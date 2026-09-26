<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Package manager: always Bun

This repo is a Bun project (`packageManager` in `package.json`, `bun.lock`).
Use Bun for every command. Do **not** use `npm`, `npx`, `yarn`, or `pnpm`.

| Instead of | Use |
| --- | --- |
| `npm install` / `npm i` | `bun install` |
| `npm install <pkg>` | `bun add <pkg>` |
| `npm uninstall <pkg>` | `bun remove <pkg>` |
| `npm run <script>` | `bun run <script>` (e.g. `bun run dev`, `bun run build`, `bun run lint`) |
| `npx <pkg>` | `bunx <pkg>` (e.g. `bunx tsc --noEmit`, `bunx convex codegen`) |

Running npm/npx creates a second lockfile and drifts the install away from
`bun.lock`, so never use them — including when a tool's own docs, error
messages, or the generated blocks in this file mention `npx`. Translate those
to `bunx` instead.
