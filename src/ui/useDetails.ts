import { useEffect, useMemo, useState } from 'react'
import { SYSTEM_BY_ID, type SystemInfo } from '../data/systems'
import { describe, getSelection, loadDescriptions, type Selection } from '../lib/anatomyData'
import { activeSystem, useAnatomyStore } from '../store/useAnatomyStore'

/** The current selection (part or group), resolved against the parts index. */
export function useSelection(): Selection | null {
  const selected = useAnatomyStore((s) => s.selected)
  const index = useAnatomyStore((s) => s.index)
  return useMemo(() => (selected && index ? getSelection(index, selected) : null), [selected, index])
}

export interface Details {
  system: SystemInfo
  sel: Selection | null
  description: { text: string; from: string } | null
}

/** What the dashboard panels describe: the selection, or the active system. */
export function useDetails(): Details {
  const sel = useSelection()
  const systemId = useAnatomyStore(activeSystem)
  const [descriptions, setDescriptions] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (sel && !descriptions) loadDescriptions().then(setDescriptions)
  }, [sel, descriptions])

  return {
    system: SYSTEM_BY_ID[sel?.system ?? systemId],
    sel,
    description: sel && descriptions ? describe(descriptions, sel) : null,
  }
}

/** First sentence or two of a description, for the hero area. */
export function summary(text: string, max = 230) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const end = cut.lastIndexOf('. ')
  return end > 80 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`
}
