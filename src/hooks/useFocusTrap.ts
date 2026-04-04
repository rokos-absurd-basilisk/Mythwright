import { useEffect, type RefObject } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return
    const el = ref.current
    const prev = document.activeElement as HTMLElement | null
    ;(el.querySelector<HTMLElement>(FOCUSABLE))?.focus()

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const all = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(n=>n.offsetParent!==null)
      if (!all.length) { e.preventDefault(); return }
      const first = all[0], last = all[all.length-1]
      if (e.shiftKey) { if (document.activeElement===first) { e.preventDefault(); last.focus() } }
      else            { if (document.activeElement===last)  { e.preventDefault(); first.focus() } }
    }
    el.addEventListener('keydown', trap)
    return () => { el.removeEventListener('keydown', trap); prev?.focus?.() }
  }, [active, ref])
}
