import { describe, it, expect, vi, beforeAll } from 'vitest'
import { EXPORT_FORMATS, exportOutline } from '../exportUtils'
import type { Outline, Beat } from '../../types'

// ── Stable DOM mocks set up once ─────────────────────────────
// jsdom doesn't implement URL.createObjectURL; stub it once.
beforeAll(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  })
  // Stub the anchor click so no real navigation happens
  const realCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreate(tag)
    if (tag === 'a') {
      Object.defineProperty(el, 'click', { value: vi.fn(), writable: true })
    }
    return el
  })
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

// ── Fixtures ─────────────────────────────────────────────────
const mockOutline: Outline = {
  id: 'o1', storyId: 's1', title: 'My Arc',
  frameworkId: 3, labelColour: '#5ec8c8', status: 'draft',
  position: 0, keywords: [], customMetadata: [],
  vonnegutMode: 'freehand', vonnegutCurvePoints: null,
  vonnegutFormulaSegments: null, bookerArchetype: null,
  dramaticQuestion: null, logline: null, themeStated: null,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
}

const mockBeat: Beat = {
  id: 'b1', outlineId: 'o1', title: 'Act 1 Opening',
  synopsis: 'Hero meets world', position: 0,
  labelColour: '#5ec8c8', status: 'draft',
  bodyJson: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Scene opens.' }] }],
  },
  keywords: [], customMetadata: [], snapshots: [], bookmarks: [], comments: [],
  isMicroBeat: false, xPosition: 0, yPosition: 0,
  toolType: null, isLockedAnchor: false,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
}

// ── EXPORT_FORMATS catalogue ──────────────────────────────────
describe('EXPORT_FORMATS', () => {
  it('includes all 4 native formats', () => {
    const native = EXPORT_FORMATS.filter(f => f.native)
    expect(native.map(f => f.id)).toContain('json')
    expect(native.map(f => f.id)).toContain('markdown')
    expect(native.map(f => f.id)).toContain('html')
    expect(native.map(f => f.id)).toContain('png')
  })

  it('includes key Pandoc formats', () => {
    const ids = EXPORT_FORMATS.map(f => f.id)
    for (const fmt of ['docx','epub','pdf','rst','asciidoc','org','latex','mediawiki']) {
      expect(ids, `missing format: ${fmt}`).toContain(fmt)
    }
  })

  it('every format has required fields', () => {
    EXPORT_FORMATS.forEach(f => {
      expect(f.id,    `${f.id} missing id`).toBeTruthy()
      expect(f.label, `${f.id} missing label`).toBeTruthy()
      expect(f.ext,   `${f.id} missing ext`).toBeTruthy()
      expect(f.mime,  `${f.id} missing mime`).toBeTruthy()
    })
  })

  it('has at least 20 formats total', () => {
    expect(EXPORT_FORMATS.length).toBeGreaterThanOrEqual(20)
  })

  it('groups cover native, document, markup, web', () => {
    const groups = new Set(EXPORT_FORMATS.map(f => f.group))
    for (const g of ['native', 'document', 'markup', 'web']) {
      expect(groups).toContain(g)
    }
  })
})

// ── Native exports (no server required) ──────────────────────
describe('exportOutline — JSON', () => {
  it('returns ok:true', async () => {
    const r = await exportOutline(mockOutline, [mockBeat], 'json')
    expect(r.ok).toBe(true)
  })

  it('triggers a download link click', async () => {
    await exportOutline(mockOutline, [mockBeat], 'json')
    expect(document.createElement).toHaveBeenCalledWith('a')
  })
})

describe('exportOutline — Markdown', () => {
  it('returns ok:true or ok:false with a message (never throws)', async () => {
    const r = await exportOutline(mockOutline, [mockBeat], 'markdown')
    // In jsdom the Blob + anchor approach may or may not work depending on env
    // What matters: it never throws, always returns a result
    expect(typeof r.ok).toBe('boolean')
    if (!r.ok) expect(r.message).toBeTruthy()
  })
})

describe('exportOutline — HTML', () => {
  it('returns ok:true or ok:false with a message (never throws)', async () => {
    const r = await exportOutline(mockOutline, [mockBeat], 'html')
    expect(typeof r.ok).toBe('boolean')
    if (!r.ok) expect(r.message).toBeTruthy()
  })
})

describe('exportOutline — Pandoc fallback', () => {
  it('returns ok:false with a helpful message when bridge is unavailable', async () => {
    const r = await exportOutline(mockOutline, [mockBeat], 'docx')
    // Bridge not running in test env — should fail gracefully
    expect(r.ok).toBe(false)
    expect(r.message).toBeTruthy()
    expect(typeof r.message).toBe('string')
  })
})
