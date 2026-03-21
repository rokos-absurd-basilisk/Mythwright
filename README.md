# Mythwright

> *Forge your narrative.*

A visual story outlining and plotting web application for novelists, screenwriters, and storytellers. Built with React 19 + Vite, Zustand, TipTap, dnd-kit, and React Flow.

## Features

- **7 plotting frameworks** — from Booker's archetypes to Save the Cat to a freeform Toolbox
- **Vonnegut curve editor** — interactive Bézier freehand mode + mathematical Formula Mode with 10 curve types, sharp-shift detection
- **Scrivener-inspired layout** — Binder | Canvas | Inspector three-panel UI
- **4 view modes** — Framework, Corkboard, Mindmap (React Flow), Outliner
- **Rich Inspector** — TipTap notes, synopsis, snapshots, bookmarks, comments
- **Offline-first** — localStorage primary store, Supabase background sync
- **Export** — JSON, Markdown, HTML, PNG
- **Tutorial mode** — Coach marks with animated zigzag wire, workflow modals

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| State | Zustand v5 (slices + `useShallow`) |
| Drag & Drop | dnd-kit |
| Mindmap | @xyflow/react (React Flow) |
| Rich Text | TipTap (headless, ProseMirror) |
| Styling | Tailwind CSS v4 |
| Animations | CSS transitions + Framer Motion (targeted) |
| Sync | localStorage-first + Supabase background sync |
| Auth | Supabase Auth |

## Getting Started

```bash
npm install
cp .env.example .env          # optional — Supabase sync
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Self-hosting

```bash
npm run build
# Deploy dist/ to any static host: Nginx, Cloudflare Pages, Vercel, etc.
```

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both optional — the app works fully offline without Supabase.

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `dev` | Active development |

## Roadmap

- [x] Part 1 — Scaffold, design tokens, Zustand stores, AppShell
- [x] Part 2 — All 7 frameworks, Vonnegut Formula Mode, sharp-shift detection
- [x] Part 3 — Inspector (TipTap, snapshots, bookmarks, comments), Corkboard, Mindmap, Outliner
- [ ] Part 4 — Export system, Split Mode, dnd-kit Binder sorting
- [ ] Part 5 — Supabase auth + sync, Tutorial mode
- [ ] Part 6 — Polish, accessibility, performance

## License

MIT
