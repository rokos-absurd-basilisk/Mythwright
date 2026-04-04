// ============================================================
// MYTHWRIGHT — TAG INPUT
// Multi-tag chip input. Enter/comma to add, × to remove.
// Used in Inspector "Info" tab for keywords.
// ============================================================
import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags:     string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export function TagInput({ tags, onChange, placeholder = 'Add keyword…', maxTags = 20 }: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[,]+$/,'')
    if (!tag || tags.includes(tag) || tags.length >= maxTags) return
    onChange([...tags, tag])
    setInput('')
  }

  const remove = (tag: string) => onChange(tags.filter(t => t !== tag))

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1])
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] cursor-text min-h-[36px]"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 h-5 rounded-[var(--radius-pill)] text-[11px] font-medium"
          style={{ background:'var(--accent-teal-10)', color:'var(--accent-teal)', border:'1px solid var(--accent-teal)' }}>
          {tag}
          <button onClick={() => remove(tag)} className="hover:opacity-70 transition-opacity"
            aria-label={`Remove tag ${tag}`}>
            <X size={9}/>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => { setInput(e.target.value); if (e.target.value.endsWith(',')) add(e.target.value) }}
        onKeyDown={onKey}
        onBlur={() => add(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
        aria-label="Add keyword tag"
      />
    </div>
  )
}
