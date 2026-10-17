import { useProgress } from '@react-three/drei'
import { useAnatomyStore } from '../store/useAnatomyStore'

export function TopBar() {
  const { active, progress } = useProgress()
  const explored = useAnatomyStore((s) => s.explored)
  const parts = Object.keys(explored).filter((k) => !k.startsWith('system:')).length
  const quality = useAnatomyStore((s) => s.quality)
  const toggleQuality = useAnatomyStore((s) => s.toggleQuality)

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent shadow-[0_6px_18px_rgb(232_50_43/0.35)]">
          <span className="h-4 w-4 rounded-full border-[2.5px] border-white" />
        </span>
        <div>
          <div className="label text-lg leading-none tracking-[0.22em] text-ink">Anatomy Nexus</div>
          <div className="label mt-1 text-[10px] text-muted">Structure · System · Function</div>
        </div>
      </div>

      <div className="hidden items-center gap-3 rounded-full border border-line bg-white px-5 py-2 md:flex">
        <span className="label text-[11px] text-muted">{active ? `Loading model ${Math.round(progress)}%` : 'Scan active'}</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleQuality}
          className="label rounded-full border border-line bg-white px-3 py-1.5 text-[10px] text-muted transition hover:text-ink"
          title="Switch rendering quality"
        >
          Quality: <span className="text-accent">{quality}</span>
        </button>
        <div className="card hidden items-center gap-3 px-4 py-2 sm:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#f1e3dc] to-[#d9b9aa] text-xs font-semibold text-ink/70">
            ID
          </span>
          <div>
            <div className="label text-[12px] leading-none text-ink">Explorer</div>
            <div className="label mt-1 text-[10px] text-accent">{parts} parts discovered</div>
          </div>
        </div>
      </div>
    </header>
  )
}
