import { useEffect } from 'react'
import { loadPartsIndex } from './lib/anatomyData'
import { useAnatomyStore } from './store/useAnatomyStore'
import { Scene } from './three/Scene'
import { ActionBar } from './ui/ActionBar'
import { HeroInfo } from './ui/HeroInfo'
import { HoverTooltip } from './ui/HoverTooltip'
import { LayerList } from './ui/LayerList'
import { SpecsPanel } from './ui/SpecsPanel'
import { StatTiles } from './ui/StatTiles'
import { TopBar } from './ui/TopBar'
import { SystemNav, ViewControls } from './ui/ViewControls'

export default function App() {
  const ready = useAnatomyStore((s) => s.index !== null)

  useEffect(() => {
    loadPartsIndex().then(useAnatomyStore.getState().setIndex)
  }, [])

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar />
      <main className="grid flex-1 grid-cols-1 gap-4 px-4 pb-3 lg:min-h-0 lg:grid-cols-[270px_minmax(0,1fr)_360px]">
        <div className="order-2 lg:order-1 lg:min-h-0 lg:[&>aside]:h-full">
          <LayerList />
        </div>

        <section className="card relative order-1 h-[78vh] min-h-[560px] overflow-hidden lg:order-2 lg:h-auto lg:min-h-0">
          <div className="absolute inset-0">
            <Scene />
          </div>
          {!ready && (
            <div className="label absolute inset-0 grid place-items-center text-[12px] text-muted">Preparing anatomy…</div>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
            <ViewControls />
            <ActionBar />
          </div>
          <div className="pointer-events-none absolute inset-0">
            <SystemNav />
          </div>
        </section>

        {/* Right column: what you're looking at (title, description, stats), then specifications. */}
        <div className="scroll-thin order-3 flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
          <section className="card shrink-0 p-5">
            <HeroInfo />
            <div className="mt-4">
              <StatTiles />
            </div>
          </section>
          <div className="shrink-0">
            <SpecsPanel />
          </div>
        </div>
      </main>
      <footer className="px-6 pb-3 text-[11px] text-muted">
        3D anatomy: <a className="underline" href="https://www.z-anatomy.com" target="_blank" rel="noreferrer">Z-Anatomy</a> (based on BodyParts3D, © DBCLS), CC BY-SA 4.0 · Descriptions from Wikipedia via Z-Anatomy, CC BY-SA · For education, not medical advice.
      </footer>
      <HoverTooltip />
    </div>
  )
}
