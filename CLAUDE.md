# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

This is a Next.js 16 App Router project. The App Router differs significantly from older Next.js versions — always read `node_modules/next/dist/docs/` before writing code that touches routing, data fetching, or rendering.

**Stack:**
- Next.js 16 (App Router only — no Pages Router)
- React 19
- TypeScript
- Tailwind CSS v4 (imported via `@import "tailwindcss"` in CSS, not `@tailwind` directives)

**Key conventions in this version:**

- All components in `src/app/` are **Server Components by default**. Add `'use client'` only when you need state, event handlers, browser APIs, or `useEffect`.
- `params` in page/layout components is now a **Promise** — always `await params` before destructuring: `const { id } = await params`.
- Route handlers live in `src/app/.../route.ts` files.
- The `src/app/layout.tsx` is the root layout; `src/app/page.tsx` is the home route.
- Static assets go in `public/`.
- Path alias `@/*` maps to `src/*`.

**Tailwind CSS v4 differences:**
- Configuration is done in CSS via `@theme` blocks, not in a `tailwind.config.*` file.
- Custom tokens are defined in `globals.css` under `@theme inline { ... }`.
