import { CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore } from '../../store'
import { type BookerArchetype } from '../../types'

interface Archetype {
  id: BookerArchetype
  num: number
  name: string
  desc: string
  examples: string
}

const ARCHETYPES: Archetype[] = [
  { id: 'overcoming_the_monster', num: 1, name: 'Overcoming the Monster',
    desc: 'The protagonist must defeat a threatening antagonist to restore order and safety.',
    examples: 'Alien · Jaws · Harry Potter' },
  { id: 'rags_to_riches', num: 2, name: 'Rags to Riches',
    desc: 'A character rises from poverty or obscurity to wealth, success, or recognition.',
    examples: 'Slumdog Millionaire · Cinderella' },
  { id: 'the_quest', num: 3, name: 'The Quest',
    desc: 'The hero journeys toward a crucial destination or object, overcoming obstacles along the way.',
    examples: 'Indiana Jones · The Lord of the Rings' },
  { id: 'voyage_and_return', num: 4, name: 'Voyage and Return',
    desc: 'The protagonist travels to a strange new world, has adventures, and returns fundamentally changed.',
    examples: 'Alice in Wonderland · The Wizard of Oz' },
  { id: 'comedy', num: 5, name: 'Comedy',
    desc: 'Characters navigate misunderstandings and chaos before reaching a joyful resolution.',
    examples: 'When Harry Met Sally · Much Ado About Nothing' },
  { id: 'tragedy', num: 6, name: 'Tragedy',
    desc: "A flawed protagonist's mistakes lead inexorably to their downfall.",
    examples: 'Breaking Bad · Macbeth · Hamlet' },
  { id: 'rebirth', num: 7, name: 'Rebirth',
    desc: 'A character trapped in darkness or stasis experiences transformation and renewal.',
    examples: 'A Christmas Carol · Beauty and the Beast' },
]

export function BookerFramework({ outlineId }: { outlineId: string }) {
  const outline   = useBoundStore(s => s.outlines.find(o => o.id === outlineId))
  const updateOutline = useBoundStore(s => s.updateOutline)
  const selected  = outline?.bookerArchetype

  const select = (id: BookerArchetype) => {
    updateOutline(outlineId, { bookerArchetype: id })
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-page-enter">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-widest text-[var(--accent-orange)] mb-1">
          Christopher Booker's 7 Types of Stories
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Every story fits one of these seven archetypal patterns. Select the one that best describes your narrative concept.
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARCHETYPES.map(arch => {
            const isSelected = selected === arch.id
            return (
              <button
                key={arch.id}
                onClick={() => select(arch.id)}
                className={clsx(
                  'relative flex items-start gap-4 p-5 rounded-[var(--radius-xl)] border text-left',
                  'transition-all duration-[var(--dur-normal)] group',
                  isSelected
                    ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-10)] shadow-[0_0_0_1px_var(--accent-teal)]'
                    : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]'
                )}
              >
                {/* Number badge */}
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-[family-name:var(--font-heading)] font-bold text-lg text-white"
                  style={{ background: 'var(--accent-orange)' }}
                >
                  {arch.num}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="font-[family-name:var(--font-heading)] font-semibold text-[15px] uppercase tracking-wide text-[var(--text-primary)] mb-1">
                    {arch.name}
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-2">
                    {arch.desc}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] italic">
                    {arch.examples}
                  </p>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <CheckCircle
                    size={18}
                    className="flex-shrink-0 text-[var(--accent-teal)] mt-0.5"
                  />
                )}
              </button>
            )
          })}
        </div>

        {!selected && (
          <p className="text-center text-[13px] text-[var(--text-muted)] mt-8">
            No archetype selected yet. Your outline will still work — this is a concept-level guide.
          </p>
        )}
      </div>
    </div>
  )
}
