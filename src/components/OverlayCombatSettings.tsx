import React from 'react'
import type { OverlayConfig } from '../engine/overlayMeter'

export function OverlayCombatSettings({ config, configure }: {
  config: OverlayConfig; configure: (patch: Partial<OverlayConfig>) => void
}): React.ReactElement {
  return <section className="overlay-combat-settings" aria-label="Visibilidade fora de combate">
    <label className="overlay-combat-toggle"><input type="checkbox" checked={Boolean(config.hideOutOfCombat)}
      onChange={event => configure({ hideOutOfCombat: event.target.checked })} />Ocultar fora de combate</label>
    {config.hideOutOfCombat && <label className="overlay-combat-delay">Ocultar após <output>{config.combatHideDelaySec ?? 10} s</output>
      <input aria-label="Tempo para ocultar fora de combate" type="range" min="3" max="60" step="1" value={config.combatHideDelaySec ?? 10}
        onChange={event => configure({ combatHideDelaySec: Number(event.target.value) })} /></label>}
    <p>Total e gráfico reaparecem ao causar ou receber dano. Durante os ajustes, continuam visíveis; o controle permanece acessível.</p>
  </section>
}
