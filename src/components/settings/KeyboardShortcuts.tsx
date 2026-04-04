// ============================================================
// MYTHWRIGHT — KEYBOARD SHORTCUTS REFERENCE
// Rendered inside SettingsPanel.
// ============================================================

interface Shortcut {
  keys:  string[]
  label: string
}

const GROUPS: { heading: string; shortcuts: Shortcut[] }[] = [
  {
    heading: 'Global',
    shortcuts: [
      { keys: ['⌘','K'],       label: 'Quick Search'          },
      { keys: ['⌘','\\'],      label: 'Toggle Split Mode'      },
      { keys: ['⌘','E'],       label: 'Export outline'         },
      { keys: ['F11'],          label: 'Focus / Composition Mode' },
      { keys: ['Esc'],          label: 'Exit mode / close panel' },
    ],
  },
  {
    heading: 'Navigation',
    shortcuts: [
      { keys: ['↑','↓'],       label: 'Move through search results' },
      { keys: ['↵'],            label: 'Open selected result'   },
      { keys: ['Tab'],          label: 'Next focusable element' },
      { keys: ['⇧','Tab'],     label: 'Previous focusable element' },
    ],
  },
  {
    heading: 'Notes Editor',
    shortcuts: [
      { keys: ['⌘','B'],       label: 'Bold'                   },
      { keys: ['⌘','I'],       label: 'Italic'                 },
      { keys: ['⌘','⇧','H'],  label: 'Heading'                },
      { keys: ['Tab'],          label: 'Indent list item'       },
      { keys: ['⇧','Tab'],     label: 'Outdent list item'      },
    ],
  },
  {
    heading: 'Vonnegut Canvas',
    shortcuts: [
      { keys: ['⇧','Click'],   label: 'Add micro-beat at cursor' },
      { keys: ['Drag'],         label: 'Move Bézier control handle' },
    ],
  },
]

function Key({ label }: { label: string }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-[family-name:var(--font-mono)] border border-[var(--border)] text-[var(--text-secondary)]"
      style={{ background: 'var(--bg-input)' }}>
      {label}
    </kbd>
  )
}

export function KeyboardShortcuts() {
  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map(({ heading, shortcuts }) => (
        <div key={heading}>
          <p className="text-[10px] uppercase tracking-[0.1em] font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)] mb-2">
            {heading}
          </p>
          <div className="flex flex-col gap-0">
            {shortcuts.map(({ keys, label }) => (
              <div key={label}
                className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Key label={k}/>
                      {i < keys.length - 1 && (
                        <span className="text-[10px] text-[var(--text-muted)]">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
