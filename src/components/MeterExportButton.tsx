import React from 'react'
import { metricCsv, metricData, type MetricPage } from '../engine/overlayAnalysis'
import type { MeterSession } from '../engine/overlayMeter'

export function MeterExportButton({ session, page }: { session: MeterSession; page: MetricPage }): React.ReactElement {
  return <button type="button" disabled={!metricData(session, page).available}
    title="Salvar os dados completos desta página em CSV neste computador" onClick={() => {
      const link = document.createElement('a')
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(metricCsv(session, page))}`
      link.download = `throne-${page}-${new Date(session.startedAt ?? Date.now()).toISOString().replace(/[:.]/g, '-')}.csv`
      link.hidden = true
      document.body.appendChild(link)
      link.click()
      link.remove()
    }}>Exportar CSV</button>
}
