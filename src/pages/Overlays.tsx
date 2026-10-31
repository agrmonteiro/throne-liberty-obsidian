import React, { useState } from 'react'
import { MeterPanel, number } from '../components/MeterPanels'
import { useOverlay } from '../hooks/useOverlay'
import { overlaySourceWarning } from '../engine/overlayMeter'
import { OverlayHistoryView } from '../components/OverlayHistoryView'
import { OverlaySourcesView } from '../components/OverlaySourcesView'
import { OverlayMetricView, metricPages, type MetricPage } from '../components/OverlayMetricView'
import { OverlayTimer } from '../components/OverlayTimer'
import { OverlayCombatSettings } from '../components/OverlayCombatSettings'
import { MeterExportButton } from '../components/MeterExportButton'
import { OverlayDeathView } from '../components/OverlayDeathView'
import '../styles/overlay.css'

const tabs = [{ id: 'live', label: 'Ao vivo' }, { id: 'sources', label: 'Origens' },
  { id: 'history', label: 'Histórico' }, { id: 'deaths', label: 'Causa mortis' }, { id: 'settings', label: 'Ajustes' }] as const

export function Overlays(): React.ReactElement {
  const { state, act } = useOverlay()
  const [tab, setTab] = useState<string>('live')
  const [speed, setSpeed] = useState(1)
  const showTab = (id: string): void => {
    setTab(id)
    requestAnimationFrame(() => document.querySelector('.overlay-dashboard')?.scrollTo({ top: 0 }))
  }
  const { config } = state
  const busy = ['live', 'starting', 'replay'].includes(state.status)
  const sourceWarning = overlaySourceWarning(state)
  const configure = (patch: Parameters<Window['overlayAPI']['configure']>[0]): void => act(() => window.overlayAPI.configure(patch))
  return <div className="overlay-editor overlay-dashboard">
    <header className="overlay-editor-heading">
      <div><span className="overlay-eyebrow">THRONE AND LIBERTY · EXPERIMENTAL</span><h1>Medidor de dano</h1></div>
      <button className="overlay-primary" onClick={() => act(() => busy ? window.overlayAPI.stop() : window.overlayAPI.start())}>
        {busy ? 'Parar leitura' : 'Iniciar leitura'}</button>
    </header>
    <div className={`overlay-connection ${state.status === 'error' ? 'error' : ''}`} role="status">
      <span className={`meter-dot ${state.status === 'live' && !sourceWarning ? 'on' : ''}`} />
      <span>{sourceWarning ?? state.message}</span>
      {state.mode === 'replay' && <strong>REPRODUÇÃO</strong>}
      <span className="overlay-source-chip">{config.sourceId === null ? 'Origem não selecionada' : `${state.sources.find(source => source.id === config.sourceId)?.name ?? 'Origem'} · ${config.sourceId}`}</span>
    </div>
    <nav className="overlay-tabs" role="tablist" aria-label="Seções do medidor" onKeyDown={event => {
      const index = tabs.findIndex(item => item.id === tab)
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
      if (next >= 0) { event.preventDefault(); showTab(tabs[next].id); document.getElementById(`meter-tab-${tabs[next].id}`)?.focus() }
    }}>
      {tabs.map(item => <button key={item.id} role="tab" id={`meter-tab-${item.id}`} aria-selected={tab === item.id}
        aria-controls={`meter-view-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => showTab(item.id)}>{item.label}</button>)}
    </nav>
    <section className="overlay-tab-panel" id="meter-view-live" role="tabpanel" aria-labelledby="meter-tab-live" hidden={tab !== 'live'}>
      <div className="overlay-section-heading"><h2>Sessão atual</h2><div className="overlay-heading-actions">
        <button disabled={!['live', 'replay'].includes(state.status) || Boolean(state.timer)} aria-pressed={Boolean(state.session.paused)}
          onClick={() => act(() => window.overlayAPI.pause(!state.session.paused))}>{state.session.paused ? 'Retomar medição' : 'Pausar medição'}</button>
        <button onClick={() => showTab('settings')}>Alterar origem</button>
        <button onClick={() => act(() => window.overlayAPI.reset())}>Resetar medição</button>
      </div></div>
      <OverlayTimer state={state} act={act} />
      <div className="overlay-live-summary"><MeterPanel panel="total" state={state} preview onReset={() => act(() => window.overlayAPI.reset())} /></div>
      <div className="overlay-live-analysis-controls"><label className="overlay-metric-select">Página do medidor<select aria-label="Página do medidor" value={config.metricPage ?? 'damage'}
        onChange={event => configure({ metricPage: event.target.value as MetricPage })}>
        {metricPages.map(page => <option key={page.id} value={page.id}>{page.label}</option>)}
      </select></label><MeterExportButton session={state.session} page={config.metricPage ?? 'damage'} /></div>
      <div className="overlay-live-skills">{!config.metricPage || config.metricPage === 'damage'
        ? <MeterPanel panel="skills" state={state} preview onReset={() => act(() => window.overlayAPI.reset())} />
        : <OverlayMetricView state={state} page={config.metricPage} />}</div>
      <p className="overlay-note">DPS inclui intervalos sem atacar. A pausa manual congela valores e tempo; ataques durante a pausa são descartados. Após 5 min ativos sem dano, o próximo acerto inicia outra sessão.</p>
    </section>
    <section className="overlay-tab-panel" id="meter-view-sources" role="tabpanel" aria-labelledby="meter-tab-sources" hidden={tab !== 'sources'}>
      <OverlaySourcesView state={state} />
    </section>
    <section className="overlay-tab-panel" id="meter-view-history" role="tabpanel" aria-labelledby="meter-tab-history" hidden={tab !== 'history'}>
      <OverlayHistoryView state={state} />
    </section>
    <section className="overlay-tab-panel" id="meter-view-deaths" role="tabpanel" aria-labelledby="meter-tab-deaths" hidden={tab !== 'deaths'}>
      <OverlayDeathView state={state} active={tab === 'deaths'} />
    </section>
    <section className="overlay-tab-panel" id="meter-view-settings" role="tabpanel" aria-labelledby="meter-tab-settings" hidden={tab !== 'settings'}>
      <div className="overlay-settings-grid overlay-inspector">
        <section><h2>Origem do dano</h2>
          <label>Nome do personagem<input key={config.playerName ?? ''} aria-label="Nome do personagem" defaultValue={config.playerName ?? ''} maxLength={64}
            placeholder="Nome exato no jogo" onBlur={event => configure({ playerName: event.target.value })} /></label>
          <label>Origem do dano<select aria-label="Origem do dano" value={config.autoSource !== false ? 'auto' : config.sourceId ?? ''}
            onChange={event => configure({ sourceId: event.target.value === 'auto' ? null : Number(event.target.value) })}>
            <option value="auto">Meu personagem · automático</option>
            {config.autoSource === false && config.sourceId === null && <option value="" disabled>Selecione uma origem manual</option>}
            {config.sourceId !== null && !state.sources.some(source => source.id === config.sourceId) &&
              <option value={config.sourceId}>Origem {config.sourceId} · sem eventos</option>}
            {state.sources.map(source => <option key={source.id} value={source.id}>{source.localPlayer ? 'Entidade local (manual)' : source.name ?? 'Origem manual'} · {source.id} · {number(source.damage)}</option>)}
          </select></label>
          <button onClick={() => configure({ sourceId: null })}>Seguir meu personagem</button>
          <p>A seleção automática acompanha a entidade local identificada pelo protocolo. A origem manual fica fixa. Trocar de origem inicia outra medição.</p>
          <p title={state.capture?.encounterId}>Medição: {state.capture?.encounterId.slice(0, 8) ?? '—'} · Entidade local: {state.capture?.player?.sourceId ?? 'aguardando identificação'}</p>
          <h2 className="overlay-subheading">Atalhos</h2>
          <dl><dt>Voltar ao atual</dt><dd>Ctrl + Shift + F8</dd><dt>Travar / editar</dt><dd>Ctrl + Shift + F9</dd><dt>Mostrar / ocultar</dt><dd>Ctrl + Shift + F10</dd><dt>Painel de ajustes</dt><dd>Ctrl + Shift + F11</dd></dl>
        </section>
        <section><h2>Overlays sobre o jogo</h2>
          <OverlayCombatSettings config={config} configure={configure} />
          <label className="overlay-switch"><input type="checkbox" checked={config.controlsVisible !== false} onChange={event => configure({ controlsVisible: event.target.checked })} />Controle de ajustes no jogo</label>
          <label className="overlay-switch"><input type="checkbox" checked={config.totalVisible} onChange={event => configure({ totalVisible: event.target.checked })} />Total geral</label>
          <button onClick={() => configure({ totalVisible: true, anchors: { total: { x: .5, y: 0 } } })}>Restaurar total no topo</button>
          <label className="overlay-switch"><input type="checkbox" checked={config.skillsVisible} onChange={event => configure({ skillsVisible: event.target.checked })} />Por habilidade</label>
          <label className="overlay-switch"><input type="checkbox" checked={config.locked} onChange={event => configure({ locked: event.target.checked })} />Travar e passar cliques ao jogo</label>
          <label>Opacidade <span>{Math.round(config.opacity * 100)}%</span><input aria-label="Opacidade" type="range" min="25" max="100" value={config.opacity * 100} onChange={event => configure({ opacity: Number(event.target.value) / 100 })} /></label>
          <label>Escala <span>{Math.round(config.scale * 100)}%</span><input aria-label="Escala" type="range" min="75" max="150" value={config.scale * 100} onChange={event => configure({ scale: Number(event.target.value) / 100 })} /></label>
          <label>Margem horizontal do gráfico <span>{config.chartPadding ?? 12} px</span><input aria-label="Margem horizontal do gráfico" type="range" min="0" max="32" step="1" value={config.chartPadding ?? 12} onChange={event => configure({ chartPadding: Number(event.target.value) })} /></label>
          <label>Margem vertical do gráfico <span>{config.chartPaddingVertical ?? 10} px</span><input aria-label="Margem vertical do gráfico" type="range" min="0" max="32" step="1" value={config.chartPaddingVertical ?? 10} onChange={event => configure({ chartPaddingVertical: Number(event.target.value) })} /></label>
          <p>Ajuste as distâncias laterais e acima/abaixo do conteúdo em cada linha do gráfico.</p>
          <p>Os painéis acompanham a janela do TL e ficam dentro da área do jogo. Ajuste fonte, cores e posições pelo controle no jogo. A captura continua ao alternar de aplicativo.</p>
        </section>
      </div>
      <div className="overlay-help-sections">
        <details className="overlay-requirements"><summary>Requisitos e compatibilidade</summary>
          <ul><li>Windows e Python de 64 bits. Python testado: 3.14.</li><li>Npcap com Loopback disponível. Versão testada: 1.89.</li>
            <li>ExitLag ativo para TL e personagem conectado.</li></ul>
          <p>Sem ExitLag, a leitura ao vivo ainda não é suportada. Python e Npcap são instalações separadas. Node.js, Git, Razer e log de combate não são necessários.</p>
          <p>Use janela ou janela sem bordas para conferir os painéis. Tela cheia exclusiva não foi validada.</p>
        </details>
        <details><summary>Revisar uma captura</summary>
          <div className="overlay-replay-controls"><label>Velocidade<select aria-label="Velocidade da reprodução" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
            {[1, 5, 20, 100].map(value => <option key={value} value={value}>{value}×</option>)}
          </select></label><button onClick={() => act(() => window.overlayAPI.replay(speed))}>Reproduzir captura</button></div>
          <p>Reprodução identificada; iniciar outra leitura reinicia o acumulado atual.</p>
        </details>
        <details><summary>Logs de habilidades sem nome <span>{number(state.unknownSkillLog?.ids ?? 0)} IDs</span></summary>
          <p>{number(state.unknownSkillLog?.events ?? 0)} eventos gravados nesta execução para mapeamento.</p>
          {state.unknownSkillLog?.directory && <p className="overlay-log-path">{state.unknownSkillLog.directory}</p>}
          {state.unknownSkillLog?.error && <p role="alert">{state.unknownSkillLog.error}</p>}
        </details>
      </div>
    </section>
  </div>
}
