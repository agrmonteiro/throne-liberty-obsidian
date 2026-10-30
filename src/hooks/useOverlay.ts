import { useEffect, useState } from 'react'
import { OverlayMeter, resolveOverlayNames, type OverlayState } from '../engine/overlayMeter'
import names from '../data/overlaySkillNames.json'

const initial: OverlayState = {
  config: { locked: false, totalVisible: false, skillsVisible: false, controlsVisible: true, controlsExpanded: false,
    fontFamily: 'Inter', fontSize: 13, chartPadding: 12, opacity: .94, scale: 1, sourceId: null },
  session: new OverlayMeter().snapshot(), status: 'stopped', mode: null, message: 'Conectando ao app…', sources: [],
}
export function useOverlay(): { state: OverlayState; act: (operation: () => Promise<unknown>) => void } {
  const [state, setState] = useState(initial)
  useEffect(() => {
    if (!window.overlayAPI) { setState(value => ({ ...value, message: 'Abra esta tela pelo aplicativo desktop.' })); return }
    let active = true
    const unsubscribe = window.overlayAPI.subscribe(value => { if (active) setState(resolveOverlayNames(value, names)) })
    void window.overlayAPI.get().then(value => { if (active) setState(resolveOverlayNames(value, names)) }).catch(() => {})
    return () => { active = false; unsubscribe() }
  }, [])
  function act(operation: () => Promise<unknown>): void {
    void operation().catch(error => setState(value => ({ ...value, status: 'error', message: String(error) })))
  }
  return { state, act }
}
