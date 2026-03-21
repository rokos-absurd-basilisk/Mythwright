// ============================================================
// MYTHWRIGHT — TAG SEARCH UTILITY
// Finds compass tags (#Dramatic, #Logline, #Theme) in beat notes
// ============================================================
import { type Beat, type TipTapJSON } from '../types'

export const COMPASS_TAGS = {
  dramaticQuestion: '#Dramatic',
  logline:          '#Logline',
  themeStated:      '#Theme',
} as const

export type CompassTagKey = keyof typeof COMPASS_TAGS
export type CompassTag = typeof COMPASS_TAGS[CompassTagKey]

/** Check if a TipTap JSON doc contains a given tag string */
export function docContainsTag(bodyJson: TipTapJSON, tag: string): boolean {
  if (!bodyJson || typeof bodyJson !== 'object') return false
  // Fast path: stringify search (tags are short plain strings)
  return JSON.stringify(bodyJson).includes(tag)
}

/** Find all beats whose notes contain a given tag */
export function findBeatsWithTag(beats: Beat[], tag: string): Beat[] {
  return beats.filter(b => docContainsTag(b.bodyJson, tag))
}

/** For each compass key, find which beats contain the corresponding tag */
export function compassTagMap(beats: Beat[]): Record<CompassTagKey, Beat[]> {
  return {
    dramaticQuestion: findBeatsWithTag(beats, COMPASS_TAGS.dramaticQuestion),
    logline:          findBeatsWithTag(beats, COMPASS_TAGS.logline),
    themeStated:      findBeatsWithTag(beats, COMPASS_TAGS.themeStated),
  }
}
