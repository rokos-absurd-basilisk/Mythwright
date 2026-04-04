import { useState } from 'react'
import { clsx } from 'clsx'

const PRESETS = [
  '#5ec8c8','#e8933a','#a78bfa','#f472b6',
  '#34d399','#60a5fa','#fbbf24','#c45050',
  '#94a3b8','#f97316','#84cc16','#e879f9',
]

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [custom, setCustom] = useState('')
  const [err,    setErr]    = useState(false)

  const handleCustom = (v: string) => {
    setCustom(v)
    const clean = v.startsWith('#') ? v : `#${v}`
    const valid = /^#[0-9a-fA-F]{6}$/.test(clean)
    setErr(!valid && v.length > 0)
    if (valid) onChange(clean)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">
          {label}
        </label>
      )}
      <div className="grid grid-cols-6 gap-1.5">
        {PRESETS.map(hex => (
          <button key={hex} onClick={() => { onChange(hex); setCustom('') }}
            className={clsx('w-7 h-7 rounded-[var(--radius-md)] border-2 transition-all duration-[var(--dur-fast)] hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent-teal)]',
              value === hex ? 'border-white scale-110 shadow-[0_0_0_2px_var(--accent-teal)]' : 'border-transparent'
            )}
            style={{ background: hex }}
            aria-label={hex} aria-pressed={value === hex}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded flex-shrink-0 border border-[var(--border)]" style={{ background: value }}/>
        <input type="text" value={custom || value} onChange={e => handleCustom(e.target.value)}
          placeholder="#5ec8c8" maxLength={7}
          className={clsx('flex-1 h-7 px-2 rounded-[var(--radius-md)] text-[12px] font-[family-name:var(--font-mono)]',
            'border transition-colors outline-none bg-[var(--bg-input)]',
            err ? 'border-[var(--status-blocked)] text-[var(--status-blocked)]'
                : 'border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--border-active)]'
          )}
          aria-label="Custom hex colour" aria-invalid={err}
        />
      </div>
    </div>
  )
}
