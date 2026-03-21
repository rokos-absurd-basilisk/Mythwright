import { describe, it, expect } from 'vitest'
import { create } from 'zustand'
import { createStoriesSlice,  type StoriesSlice  } from '../slices/storiesSlice'
import { createOutlinesSlice, type OutlinesSlice } from '../slices/outlinesSlice'
import { createTutorialSlice, type TutorialSlice } from '../slices/tutorialSlice'
import { createMindmapSlice,  type MindmapSlice  } from '../slices/mindmapSlice'

// ── Isolated stores per test ─────────────────────────────────────
type StoreState = StoriesSlice & OutlinesSlice & TutorialSlice & MindmapSlice

function makeStore() {
  return create<StoreState>()((...a) => ({
    ...createStoriesSlice(...a),
    ...createOutlinesSlice(...a),
    ...createTutorialSlice(...a),
    ...createMindmapSlice(...a),
  }))
}

// ── Stories slice ─────────────────────────────────────────────────
describe('storiesSlice', () => {
  it('starts empty', () => {
    const s = makeStore()
    expect(s.getState().stories).toHaveLength(0)
  })

  it('addStory creates a story with correct fields', () => {
    const s = makeStore()
    const story = s.getState().addStory('My Novel', '#5ec8c8')
    const { stories } = s.getState()
    expect(stories).toHaveLength(1)
    expect(stories[0].title).toBe('My Novel')
    expect(stories[0].labelColour).toBe('#5ec8c8')
    expect(stories[0].archived).toBe(false)
    expect(stories[0].id).toBe(story.id)
  })

  it('updateStory mutates only the specified story', () => {
    const s = makeStore()
    s.getState().addStory('A', '#5ec8c8')
    const b = s.getState().addStory('B', '#e8933a')
    s.getState().updateStory(b.id, { title: 'B Updated' })
    expect(s.getState().stories.find(x => x.id === b.id)?.title).toBe('B Updated')
    expect(s.getState().stories.find(x => x.title === 'A')?.title).toBe('A')
  })

  it('deleteStory removes the story', () => {
    const s = makeStore()
    const story = s.getState().addStory('Doomed', '#5ec8c8')
    s.getState().deleteStory(story.id)
    expect(s.getState().stories).toHaveLength(0)
  })
})

// ── Outlines slice ────────────────────────────────────────────────
describe('outlinesSlice', () => {
  it('addOutline creates with correct frameworkId and narrative null fields', () => {
    const s = makeStore()
    const story = s.getState().addStory('S', '#5ec8c8')
    const outline = s.getState().addOutline(story.id, 'Act 1', 3)
    expect(outline.frameworkId).toBe(3)
    expect(outline.dramaticQuestion).toBeNull()
    expect(outline.logline).toBeNull()
    expect(outline.themeStated).toBeNull()
  })

  it('addBeat adds to correct outline', () => {
    const s = makeStore()
    const story   = s.getState().addStory('S', '#5ec8c8')
    const outline = s.getState().addOutline(story.id, 'O', 1)
    s.getState().addBeat(outline.id, 'First Beat')
    expect(s.getState().beats.filter(b => b.outlineId === outline.id)).toHaveLength(1)
  })

  it('copyBeat duplicates beat into target outline', () => {
    const s = makeStore()
    const story    = s.getState().addStory('S', '#5ec8c8')
    const outlineA = s.getState().addOutline(story.id, 'A', 1)
    const outlineB = s.getState().addOutline(story.id, 'B', 2)
    const beat     = s.getState().addBeat(outlineA.id, 'Original')
    s.getState().copyBeat(beat.id, outlineB.id)
    const beatB = s.getState().beats.filter(b => b.outlineId === outlineB.id)
    expect(beatB).toHaveLength(1)
    expect(beatB[0].title).toBe('Original')
    expect(beatB[0].id).not.toBe(beat.id)  // new ID
  })

  it('deleteOutline removes all child beats', () => {
    const s = makeStore()
    const story   = s.getState().addStory('S', '#5ec8c8')
    const outline = s.getState().addOutline(story.id, 'O', 1)
    s.getState().addBeat(outline.id, 'B1')
    s.getState().addBeat(outline.id, 'B2')
    s.getState().deleteOutline(outline.id)
    expect(s.getState().beats.filter(b => b.outlineId === outline.id)).toHaveLength(0)
  })
})

// ── Tutorial slice ────────────────────────────────────────────────
describe('tutorialSlice', () => {
  it('starts with empty progress and not dismissed', () => {
    const s = makeStore()
    expect(s.getState().tutorialProgress).toHaveLength(0)
    expect(s.getState().tutorialDismissed).toBe(false)
  })

  it('markTutorialStep records completion', () => {
    const s = makeStore()
    s.getState().markTutorialStep('onboard-01')
    expect(s.getState().isTutorialStepDone('onboard-01')).toBe(true)
    expect(s.getState().isTutorialStepDone('onboard-02')).toBe(false)
  })

  it('markTutorialStep is idempotent', () => {
    const s = makeStore()
    s.getState().markTutorialStep('onboard-01')
    s.getState().markTutorialStep('onboard-01')
    expect(s.getState().tutorialProgress).toHaveLength(1)
  })

  it('resetTutorial clears all progress', () => {
    const s = makeStore()
    s.getState().markTutorialStep('onboard-01', false)
    s.getState().dismissTutorial()
    s.getState().resetTutorial()
    expect(s.getState().tutorialProgress).toHaveLength(0)
    expect(s.getState().tutorialDismissed).toBe(false)
  })
})

// ── Mindmap slice ─────────────────────────────────────────────────
describe('mindmapSlice', () => {
  const OID = 'outline-123'

  it('starts with empty state', () => {
    const s = makeStore()
    expect(s.getState().getMindmapNodes(OID)).toHaveLength(0)
    expect(s.getState().getMindmapEdges(OID)).toHaveLength(0)
    expect(s.getState().getMindmapViewport(OID)).toEqual({ x:0, y:0, zoom:1 })
  })

  it('setMindmapNodes persists nodes for outline', () => {
    const s = makeStore()
    const nodes = [{ id:'n1', x:100, y:200, data:{} }]
    s.getState().setMindmapNodes(OID, nodes)
    expect(s.getState().getMindmapNodes(OID)).toEqual(nodes)
  })

  it('setMindmapEdges persists edges per outline', () => {
    const s = makeStore()
    const edges = [{ id:'e1', source:'n1', target:'n2', animated:true }]
    s.getState().setMindmapEdges(OID, edges)
    expect(s.getState().getMindmapEdges(OID)).toEqual(edges)
  })

  it('different outlines have independent state', () => {
    const s = makeStore()
    s.getState().setMindmapNodes('outline-A', [{ id:'a', x:0, y:0, data:{} }])
    s.getState().setMindmapNodes('outline-B', [{ id:'b', x:1, y:1, data:{} }, { id:'c', x:2, y:2, data:{} }])
    expect(s.getState().getMindmapNodes('outline-A')).toHaveLength(1)
    expect(s.getState().getMindmapNodes('outline-B')).toHaveLength(2)
  })
})
