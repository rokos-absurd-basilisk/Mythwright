import { StateCreator } from 'zustand'
import { Story, Note, UUID, HexColour } from '../../types'
import { nanoid } from '../utils'

export interface StoriesSlice {
  stories: Story[]
  notes: Note[]
  addStory: (title: string, labelColour?: HexColour) => Story
  updateStory: (id: UUID, updates: Partial<Story>) => void
  deleteStory: (id: UUID) => void
  reorderStories: (ids: UUID[]) => void
  addNote: (storyId: UUID, title: string) => Note
  updateNote: (id: UUID, updates: Partial<Note>) => void
  deleteNote: (id: UUID) => void
}

export const createStoriesSlice: StateCreator<StoriesSlice> = (set, get) => ({
  stories: [],
  notes: [],

  addStory: (title, labelColour = '#5ec8c8') => {
    const story: Story = {
      id: nanoid(),
      title,
      labelColour,
      status: 'draft',
      archived: false,
      position: get().stories.length,
      customMetadata: [],
      keywords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ stories: [...s.stories, story] }))
    return story
  },

  updateStory: (id, updates) => {
    set(s => ({
      stories: s.stories.map(st =>
        st.id === id ? { ...st, ...updates, updatedAt: new Date().toISOString() } : st
      )
    }))
  },

  deleteStory: (id) => {
    set(s => ({
      stories: s.stories.filter(st => st.id !== id),
      notes: s.notes.filter(n => n.storyId !== id),
    }))
  },

  reorderStories: (ids) => {
    set(s => ({
      stories: ids.map((id, i) => {
        const st = s.stories.find(x => x.id === id)!
        return { ...st, position: i }
      })
    }))
  },

  addNote: (storyId, title) => {
    const note: Note = {
      id: nanoid(),
      storyId,
      title,
      bodyJson: { type: 'doc', content: [] },
      labelColour: '#5ec8c8',
      status: 'draft',
      position: get().notes.filter(n => n.storyId === storyId).length,
      keywords: [],
      customMetadata: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ notes: [...s.notes, note] }))
    return note
  },

  updateNote: (id, updates) => {
    set(s => ({
      notes: s.notes.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    }))
  },

  deleteNote: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),
})
