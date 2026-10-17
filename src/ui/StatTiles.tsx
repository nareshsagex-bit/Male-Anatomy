import { sideOf } from '../lib/anatomyData'
import { useAnatomyStore } from '../store/useAnatomyStore'
import { useDetails } from './useDetails'

const ICONS = ['◈', '⚡', '◆']

/** Three stat tiles under the hero (system facts, or where the selection sits). */
export function StatTiles() {
  const { system, sel } = useDetails()
  const mode = useAnatomyStore((s) => s.mode)
  if (mode === 'exploded') return null

  const tiles = sel
    ? [
        { label: 'System', value: system.title[0] },
        { label: 'Group', value: sel.path[sel.path.length - 1] ?? system.title[0] },
        sel.kind === 'group' ? { label: 'Parts', value: String(sel.ids.length) } : { label: 'Side', value: sideOf(sel) },
      ]
    : system.stats

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((t, i) => (
        <div key={t.label} className="min-w-0 rounded-xl border border-line bg-white px-2.5 py-2">
          <div className="text-[11px] text-accent">{ICONS[i]}</div>
          <div className="label mt-0.5 truncate text-[9px] text-muted">{t.label}</div>
          <div className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{t.value}</div>
        </div>
      ))}
    </div>
  )
}
