import React, { useCallback, useEffect, useState } from 'react'
import { MeterPanel, number, duration } from './MeterPanels'
import { resolveOverlayNames, type OverlayHistoryResult, type OverlayState } from '../engine/overlayMeter'
import { overlaySkillNames as names, overlaySkillFiles } from '../engine/overlaySkillReference'
import { OverlayMetricView, metricPages, type MetricPage } from './OverlayMetricView'
import { comparableEncounters } from '../engine/overlayAnalysis'
import { OverlayEncounterComparison } from './OverlayEncounterComparison'
import { MeterExportButton } from './MeterExportButton'

export function OverlayHistoryView({ state }: { state: OverlayState }): React.ReactElement {
  const [history, setHistory] = useState<OverlayHistoryResult>({ encounters: [], error: null })
  const [selectedId, setSelectedId] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [page, setPage] = useState<MetricPage>('damage')
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const refresh = useCallback(async () => {
    try { setHistory(await window.overlayAPI.history()) }
    catch (error) { setHistory(value => ({ ...value, error: `Não foi possível carregar os encontros: ${String(error)}` })) }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), 5000)
    return () => clearInterval(timer)
  }, [refresh])
  const selected = history.encounters.find(row => row.id === selectedId) ?? history.encounters[0]
  const historical = selected ? resolveOverlayNames({ ...state, session: selected.session,
    mode: selected.mode, status: 'stopped', config: { ...state.config, locked: true, sourceId: selected.sourceId } }, names, overlaySkillFiles) : null
  const candidates = selected ? history.encounters.filter(row => comparableEncounters(selected, row)) : []
  const reference = candidates.find(row => row.id === referenceId)
  const referenceSession = reference ? resolveOverlayNames({ ...state, session: reference.session }, names, overlaySkillFiles).session : null
  return <section id="overlay-encounter-history" className="overlay-history" aria-label="Histórico dos encontros">
    <div className="overlay-history-heading"><h2>Últimos 20 encontros <span>{history.encounters.length}/20</span></h2>
      <div className="overlay-heading-actions"><button onClick={() => void refresh()}>Atualizar histórico</button>
        <button onClick={() => setConfirmClear(true)}>Limpar registros</button></div></div>
    {confirmClear && <div className="overlay-clear-confirm" role="group" aria-label="Confirmar limpeza de registros">
      <p>Apaga os encontros salvos e os logs de IDs sem nome do medidor neste computador. A medição atual continua; novos danos voltam a gerar arquivos. Os logs originais do jogo são preservados.</p>
      <button disabled={clearing} onClick={async () => {
        setClearing(true)
        try { const result = await window.overlayAPI.clearRecords(); setHistory(result); setSelectedId(''); if (!result.error) setConfirmClear(false) }
        catch (error) { setHistory(value => ({ ...value, error: String(error) })) }
        finally { setClearing(false) }
      }}>Confirmar limpeza</button>
      <button disabled={clearing} onClick={() => setConfirmClear(false)}>Cancelar</button>
    </div>}
    <p>Até 20 acumulados entre resets, salvos neste computador. Consultar não altera a medição atual.</p>
    {history.error && <p role="alert">{history.error}</p>}
    {!selected ? <p>Nenhum encontro salvo ainda. Os próximos danos iniciarão o histórico.</p> : <>
      <label>Encontro salvo<select aria-label="Encontro salvo" value={selected.id} onChange={event => setSelectedId(event.target.value)}>
        {history.encounters.map(row => <option key={row.id} value={row.id}>
          {new Date(row.session.startedAt!).toLocaleString('pt-BR')} · Origem {row.sourceId} · {number(row.session.total)} dano · {row.mode === 'replay' ? 'REPRODUÇÃO' : 'Captura'}{row.reason === 'current' ? ' · Parcial' : ''}
        </option>)}
      </select></label>
      <p>{selected.sourceName ?? 'Origem'} · {selected.sourceId} · {duration(selected.session.elapsedSec)} · {number(selected.session.hits)} acertos</p>
      {selected.attributionVersion !== 2 && <p role="alert">Registro anterior à correção de atacante/alvo. A atribuição deste acumulado pode estar incorreta.</p>}
      <div className="overlay-history-analysis-controls">
        <label>Página do histórico<select aria-label="Página do histórico" value={page} onChange={event => setPage(event.target.value as MetricPage)}>
          {metricPages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Comparar com<select aria-label="Encontro de referência" value={reference?.id ?? ''} onChange={event => setReferenceId(event.target.value)}>
          <option value="">Sem comparação</option>{candidates.map(row => <option key={row.id} value={row.id}>
            {new Date(row.session.startedAt!).toLocaleString('pt-BR')} · {number(row.session.total)} dano{row.reason === 'current' ? ' · Parcial' : ''}
          </option>)}</select></label>
        {historical && <MeterExportButton session={historical.session} page={page} />}
      </div>
      {!candidates.length && <p>Sem outro registro compatível do mesmo personagem para comparar. Capturas e reproduções são comparadas separadamente.</p>}
      {historical && <div className="overlay-history-panels">
        <div><MeterPanel panel="total" state={historical} historical onReset={() => {}} /></div>
        <div>{page === 'damage' ? <MeterPanel key={selected.id} panel="skills" state={historical} historical onReset={() => {}} />
          : <OverlayMetricView key={selected.id} state={historical} historical page={page} />}</div>
      </div>}
      {historical && reference && referenceSession && <OverlayEncounterComparison
        current={{ ...selected, session: historical.session }} reference={{ ...reference, session: referenceSession }} page={page} />}
    </>}
  </section>
}
