import { toPng } from 'html-to-image'
import { type Story, type Outline, type Beat } from '../types'

// ── JSON ────────────────────────────────────────────────────────
export function exportJSON(story: Story, outline: Outline, beats: Beat[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    app: 'Mythwright', version: '1.0',
    story:   { id:story.id, title:story.title, status:story.status },
    outline: { id:outline.id, title:outline.title, frameworkId:outline.frameworkId,
               bookerArchetype:outline.bookerArchetype, vonnegutMode:outline.vonnegutMode },
    beats: beats.map(b => ({
      id:b.id, title:b.title, synopsis:b.synopsis, bodyJson:b.bodyJson,
      labelColour:b.labelColour, status:b.status, position:b.position,
      isMicroBeat:b.isMicroBeat, xPosition:b.xPosition, toolType:b.toolType,
    })),
  }
  download(JSON.stringify(data, null, 2), `${slug(outline.title)}.json`, 'application/json')
}

// ── Markdown (Obsidian-compatible) ──────────────────────────────
export function exportMarkdown(outline: Outline, beats: Beat[]): void {
  const sections = beats.map(b => {
    const body = jsonToMarkdown(b.bodyJson as Record<string, unknown>)
    return [`## ${b.title}`, b.synopsis && `*${b.synopsis}*`, body].filter(Boolean).join('\n\n')
  })
  const md = [`# ${outline.title}`, ...sections].join('\n\n---\n\n')
  download(md, `${slug(outline.title)}.md`, 'text/markdown')
}

// ── HTML (self-contained) ───────────────────────────────────────
export function exportHTML(story: Story, outline: Outline, beats: Beat[]): void {
  const beatHtml = beats.map(b => `
    <section class="beat">
      <h2 style="color:#e8933a;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.05em">${esc(b.title)}</h2>
      ${b.synopsis ? `<p class="synopsis"><em>${esc(b.synopsis)}</em></p>` : ''}
      <div class="body">${jsonToHtml(b.bodyJson as Record<string, unknown>)}</div>
    </section>`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(outline.title)} — ${esc(story.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#1a3a3a;color:#fff;font-family:Inter,sans-serif;line-height:1.7;padding:2rem}
  .header{border-bottom:2px solid #e8933a;padding-bottom:1rem;margin-bottom:2rem}
  h1{font-family:Oswald,sans-serif;font-size:2rem;text-transform:uppercase;letter-spacing:.08em;color:#e8933a;margin:0}
  .subtitle{color:#a8c8c8;font-size:.875rem;margin-top:.25rem}
  .beat{background:#1f4444;border-radius:10px;padding:1.5rem;margin-bottom:1.5rem;border-left:4px solid #5ec8c8}
  .synopsis{color:#a8c8c8;font-size:.9rem}
  .body{font-size:.9375rem}
  blockquote{border-left:3px solid #5ec8c8;padding-left:.75rem;color:#a8c8c8;font-style:italic}
</style>
</head>
<body>
<div class="header">
  <h1>${esc(outline.title)}</h1>
  <p class="subtitle">${esc(story.title)} · Framework ${outline.frameworkId} · Exported ${new Date().toLocaleDateString()}</p>
</div>
${beatHtml}
</body>
</html>`
  download(html, `${slug(outline.title)}.html`, 'text/html')
}

// ── PNG (canvas screenshot) ─────────────────────────────────────
export async function exportPNG(element: HTMLElement, filename: string): Promise<void> {
  try {
    const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('PNG export failed:', err)
  }
}

// ── Helpers ─────────────────────────────────────────────────────
function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') || 'outline' }
function esc(s: string)  { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Very simple TipTap JSON → Markdown
function jsonToMarkdown(doc: Record<string, unknown>): string {
  if (!doc || !Array.isArray(doc.content)) return ''
  return (doc.content as Record<string, unknown>[]).map(node => {
    if (node.type === 'paragraph') return inlineToMd(node.content as Record<string, unknown>[])
    if (node.type === 'heading')   return `${'#'.repeat((node.attrs as Record<string,number>)?.level ?? 1)} ${inlineToMd(node.content as Record<string, unknown>[])}`
    if (node.type === 'bulletList') return (node.content as Record<string,unknown>[]).map(li => `- ${inlineToMd((li.content as Record<string,unknown>[])?.[0]?.content as Record<string,unknown>[] ?? [])}`).join('\n')
    if (node.type === 'blockquote') return `> ${jsonToMarkdown(node as Record<string,unknown>).trim()}`
    return ''
  }).filter(Boolean).join('\n\n')
}

function inlineToMd(nodes: Record<string, unknown>[] = []): string {
  return nodes.map(n => {
    const text = String(n.text ?? '')
    const marks = (n.marks as {type:string}[] | undefined) ?? []
    let out = text
    if (marks.find(m => m.type==='bold'))   out = `**${out}**`
    if (marks.find(m => m.type==='italic')) out = `*${out}*`
    return out
  }).join('')
}

function jsonToHtml(doc: Record<string, unknown>): string {
  if (!doc || !Array.isArray(doc.content)) return ''
  return (doc.content as Record<string, unknown>[]).map(node => {
    if (node.type === 'paragraph')  return `<p>${inlineToHtml(node.content as Record<string, unknown>[])}</p>`
    if (node.type === 'heading')    return `<h${(node.attrs as Record<string,number>)?.level ?? 2}>${inlineToHtml(node.content as Record<string, unknown>[])}</h${(node.attrs as Record<string,number>)?.level ?? 2}>`
    if (node.type === 'bulletList') return `<ul>${(node.content as Record<string,unknown>[]).map(li => `<li>${inlineToHtml((li.content as Record<string,unknown>[])?.[0]?.content as Record<string,unknown>[] ?? [])}</li>`).join('')}</ul>`
    if (node.type === 'blockquote') return `<blockquote>${jsonToHtml(node as Record<string,unknown>)}</blockquote>`
    return ''
  }).join('\n')
}

function inlineToHtml(nodes: Record<string, unknown>[] = []): string {
  return nodes.map(n => {
    const text  = esc(String(n.text ?? ''))
    const marks = (n.marks as {type:string}[] | undefined) ?? []
    let out = text
    if (marks.find(m => m.type==='bold'))   out = `<strong>${out}</strong>`
    if (marks.find(m => m.type==='italic')) out = `<em>${out}</em>`
    return out
  }).join('')
}
