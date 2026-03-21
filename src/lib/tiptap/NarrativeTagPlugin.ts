// ============================================================
// MYTHWRIGHT — NARRATIVE TAG PLUGIN
// ProseMirror decoration plugin that highlights #dramatic,
// #logline, and #theme as clickable teal chips.
// Uses DecorationSet (ephemeral) — never stored in JSON.
// ============================================================
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { type NarrativeAnchor } from '../../types'

const TAG_REGEX = /#(dramatic|logline|theme)\b/gi

const TAG_TO_ANCHOR: Record<string, NarrativeAnchor> = {
  dramatic: 'dramaticQuestion',
  logline:  'logline',
  theme:    'themeStated',
}

export const narrativeTagPluginKey = new PluginKey('narrativeTagHighlight')

export function createNarrativeTagPlugin(
  onTagClick?: (anchor: NarrativeAnchor) => void
) {
  return new Plugin({
    key: narrativeTagPluginKey,
    props: {
      decorations(state) {
        const { doc }   = state
        const decos: Decoration[] = []

        doc.descendants((node, pos) => {
          if (!node.isText || !node.text) return

          const text = node.text
          TAG_REGEX.lastIndex = 0
          let match

          while ((match = TAG_REGEX.exec(text)) !== null) {
            const from  = pos + match.index
            const to    = from + match[0].length
            const tag   = match[1].toLowerCase()
            decos.push(
              Decoration.inline(from, to, {
                class:        'narrative-tag',
                'data-tag':   tag,
                style:        'cursor:pointer',
                title:        `Go to ${match[0]}`,
              })
            )
          }
        })

        return DecorationSet.create(doc, decos)
      },

      handleClick(_view, _pos, event) {
        if (!onTagClick) return false
        const target = event.target as HTMLElement
        const chip   = target.closest?.('.narrative-tag') as HTMLElement | null
        if (!chip) return false
        const tag    = chip.dataset.tag
        if (!tag) return false
        const anchor = TAG_TO_ANCHOR[tag]
        if (!anchor) return false
        onTagClick(anchor)
        return true          // prevent default ProseMirror behaviour
      },
    },
  })
}

// TipTap Extension wrapper
export const NarrativeTagExtension = (onTagClick?: (anchor: NarrativeAnchor) => void) =>
  Extension.create({
    name: 'narrativeTag',
    addProseMirrorPlugins() {
      return [createNarrativeTagPlugin(onTagClick)]
    },
  })
