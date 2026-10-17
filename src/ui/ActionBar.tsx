import { useAnatomyStore } from '../store/useAnatomyStore'

/** Bottom actions: Isolate · Explode/Back to body (primary) · X-ray. */
export function ActionBar() {
  const mode = useAnatomyStore((s) => s.mode)
  const selected = useAnatomyStore((s) => s.selected)
  const isolate = useAnatomyStore((s) => s.isolate)
  const xray = useAnatomyStore((s) => s.xray)
  const { setMode, toggleIsolate, toggleXray } = useAnatomyStore.getState()

  const secondary = (active: boolean, disabled = false) =>
    `label flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[12px] transition ${
      disabled
        ? 'cursor-not-allowed border-line bg-white/70 text-muted/60'
        : active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-white/90 text-ink hover:border-ink/20'
    }`

  return (
    <div className="pointer-events-auto flex gap-2 sm:gap-3">
      <button
        type="button"
        className={secondary(isolate, !selected || mode === 'exploded')}
        disabled={!selected || mode === 'exploded'}
        onClick={toggleIsolate}
        title={selected ? 'Show only the selected part' : 'Select a part first'}
      >
        <span>◎</span> Isolate
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === 'body' ? 'exploded' : 'body')}
        className="label flex flex-[1.3] items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-[12px] text-white shadow-[0_10px_24px_rgb(232_50_43/0.35)] transition hover:brightness-105"
      >
        <span>⊙</span> {mode === 'body' ? 'Explode' : 'Back to body'}
      </button>
      <button
        type="button"
        className={secondary(xray, mode === 'exploded')}
        disabled={mode === 'exploded'}
        onClick={toggleXray}
        title="See through the outer layers"
      >
        <span>◐</span> X-Ray
      </button>
    </div>
  )
}
