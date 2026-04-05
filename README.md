# Mythwright

> *Forge your narrative.*

A visual story outlining and plotting web application for novelists, screenwriters, and storytellers. Built with React 19 + Vite 8, Zustand v5, TipTap, dnd-kit, and React Flow.

## Features

### Seven Plotting Frameworks
- **Booker's 7 Archetypes** — card selector for story archetype
- **Vonnegut Story Shapes** — interactive Bézier curve with Freehand + Formula Mode (10 mathematical curve types, sharp-shift detection)
- **3-Act Structure** — ascending line with beat slots, teal Act II glow
- **5-Act / Freytag's Pyramid** — mountain shape + pyramid toggle
- **7-Point Plot** — winding snake path, reaction/proaction phase shading
- **Save the Cat** — sinusoidal 15-beat path, midpoint False Victory/Defeat toggle
- **The Toolbox** — drag-and-drop beat chips + CSV bulk import

### Layout
- **Scrivener-inspired 3-panel UI** — Binder | Canvas | Inspector
- **Bi-modal Binder** — switches between story tree and Narrative Context Panel
- **Narrative Compass** — Dramatic Question, Logline, Theme Stated as ambient strip + full editors; `#dramatic` `#logline` `#theme` tags in beat notes create clickable hyperlinks
- **Focus Mode** (F11) — hides all chrome, canvas expands fullscreen
- **Split Mode** (⌘\\) — two independent canvases with drag-to-copy beats between panels
- **Quick Search** (⌘K) — fuzzy search across stories, outlines, beats

### Views
- **Framework** — the plotting diagram
- **Corkboard** — index card grid with adjustable columns and Label Colour Threads (SVG splines connecting same-label cards)
- **Mindmap** — React Flow node canvas with persisted positions
- **Outliner** — spreadsheet table with inline editing

### Inspector Panel
- **TipTap rich text** notes with `#tag` hyperlinks to narrative anchors
- **Synopsis** field with character limit
- **Keywords** multi-chip tag input
- **Snapshots** — take/restore/delete timestamped versions of beat notes
- **Bookmarks** — internal links + external URLs
- **Comments** — timestamped annotation thread

### Binder
- Drag-to-reorder stories and outlines
- **Right-click context menu** on any story/outline: Rename (inline), Archive/Unarchive, Delete
- **Collections** — virtual saved filters (by status, framework type) with toggle-to-filter
- **ColorPicker** — 12 preset swatches + custom hex on story creation

### Export (22 formats)
- **In-browser:** JSON, Markdown, HTML, PNG
- **Via Pandoc bridge** (`npm run pandoc-bridge`): docx, odt, rtf, epub, pdf, rst, asciidoc, org, latex, mediawiki, jira, dokuwiki, textile, fb2, man, plain, typst, pptx

### Other
- **Toast notifications** — feedback for all key actions
- **Tutorial mode** — spotlight coach marks with animated zigzag wire + workflow modals with CSS simulations
- **Keyboard shortcuts panel** in Settings
- **Supabase auth** (optional) + localStorage-first offline sync
- **GitHub Actions CI** — lint → test → build on every push

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 (Rolldown) |
| State | Zustand v5 (6 slices + `useShallow`) |
| Drag & Drop | dnd-kit v6 |
| Mindmap | @xyflow/react (React Flow) |
| Rich Text | TipTap v3 (headless, ProseMirror) |
| Styling | Tailwind CSS v4 |
| Animations | CSS transitions + Framer Motion (targeted) |
| Auth & Sync | Supabase JS v2 (localStorage-first) |

## Getting Started

```bash
npm install
cp .env.example .env   # optional — Supabase sync
npm run dev            # http://localhost:5173
```

Supabase is entirely optional. Without it the app runs fully offline.

## Self-hosting

```bash
npm run build
# Deploy dist/ to any static host
```

**Nginx:**
```nginx
location / { try_files $uri $uri/ /index.html; }
```

**Pandoc exports** (optional):
```bash
npm run pandoc-bridge   # starts local bridge on :4567
```

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run test` | Vitest unit tests (51 tests) |
| `npm run test:coverage` | Tests with v8 coverage report |
| `npm run lint` | ESLint (0 errors) |
| `npm run pandoc-bridge` | Local Pandoc conversion server |

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `dev`  | Active development |

## License

MIT — © Absurd Literary Softwares
