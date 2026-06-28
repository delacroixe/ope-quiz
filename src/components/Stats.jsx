import { useState } from 'react'

export default function Stats({ allQuestions, questionStats }) {
  const [tab, setTab] = useState('resumen')
  const history = JSON.parse(localStorage.getItem('ope_quiz_history') || '[]')

  const total       = allQuestions.length
  const seenCount   = Object.keys(questionStats).length
  const seenPct     = total > 0 ? Math.round((seenCount / total) * 100) : 0
  const totalCorrect  = Object.values(questionStats).reduce((s, q) => s + q.correctas, 0)
  const totalAttempts = Object.values(questionStats).reduce((s, q) => s + q.vistas, 0)
  const accuracy    = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const especifico  = allQuestions.filter(q => q.bloque === 'especifico')
  const comun       = allQuestions.filter(q => q.bloque === 'comun')
  const seenEsp     = especifico.filter(q => questionStats[q.id]).length
  const seenCom     = comun.filter(q => questionStats[q.id]).length

  const avgScore    = history.length
    ? Math.round(history.reduce((s, h) => s + (h.score / h.total * 100), 0) / history.length)
    : 0
  const bestScore   = history.length
    ? Math.max(...history.map(h => Math.round(h.score / h.total * 100)))
    : 0

  // Per-tema aggregation
  const temaMap = {}
  allQuestions.forEach(q => {
    if (!temaMap[q.tema]) temaMap[q.tema] = { total: 0, seen: 0, correctas: 0, fallos: 0 }
    temaMap[q.tema].total++
    const s = questionStats[q.id]
    if (s) {
      temaMap[q.tema].seen++
      temaMap[q.tema].correctas += s.correctas
      temaMap[q.tema].fallos    += s.fallos
    }
  })

  // Unified topic table: all topics, seen first (sorted by fallos desc, then coverage), unseen at bottom
  const temaRows = Object.entries(temaMap)
    .sort(([, a], [, b]) => {
      const aSeen = a.seen > 0, bSeen = b.seen > 0
      if (aSeen !== bSeen) return bSeen - aSeen  // seen topics first
      if (b.fallos !== a.fallos) return b.fallos - a.fallos
      return (b.seen / b.total) - (a.seen / a.total)
    })

  const isEmpty = seenCount === 0 && history.length === 0

  const TABS = [
    { id: 'resumen',   label: 'Resumen' },
    { id: 'temas',     label: 'Temas' },
    { id: 'historial', label: 'Historial' },
  ]

  return (
    <div className="page">
      <h2 className="page-title">Progreso</h2>

      {isEmpty ? (
        <div className="empty-state">
          <p>Todavía no has completado ningún test.</p>
          <p>Empieza desde Inicio para ver tu progreso aquí.</p>
        </div>
      ) : (
        <>
          <div className="stats-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`stats-tab${tab === t.id ? ' stats-tab-active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── RESUMEN ── */}
          {tab === 'resumen' && (
            <>
              <div className="progress-summary">
                <div className="pscard pscard-main">
                  <RingChart pct={seenPct} color="var(--primary)" />
                  <div className="pscard-info">
                    <span className="pscard-big">{seenCount}<span className="pscard-denom">/{total}</span></span>
                    <span className="pscard-label">Preguntas vistas</span>
                    <span className="pscard-sub">{seenPct}% del banco</span>
                  </div>
                </div>
                <div className="pscard pscard-main">
                  <RingChart pct={accuracy} color={accuracy >= 60 ? 'var(--success)' : 'var(--error)'} />
                  <div className="pscard-info">
                    <span className="pscard-big" style={{ color: accuracy >= 60 ? 'var(--success)' : accuracy > 0 ? 'var(--error)' : undefined }}>
                      {accuracy}<span className="pscard-denom">%</span>
                    </span>
                    <span className="pscard-label">Precisión global</span>
                    <span className="pscard-sub">{totalCorrect} / {totalAttempts} respuestas</span>
                  </div>
                </div>
                <div className="pscard">
                  <span className="pscard-big">{history.length}</span>
                  <span className="pscard-label">Sesiones</span>
                  {history.length > 0 && <span className="pscard-sub">Media {avgScore}% · Mejor {bestScore}%</span>}
                </div>
              </div>

              <div className="stats-section">
                <h3 className="stats-section-title">Progreso por bloque</h3>
                <div className="bloque-list">
                  {[
                    { label: 'Específico (informática)', seen: seenEsp, total: especifico.length },
                    { label: 'Común (jurídico/sanitario)', seen: seenCom, total: comun.length },
                  ].map(({ label, seen, total: t }) => {
                    const pct = t > 0 ? Math.round((seen / t) * 100) : 0
                    return (
                      <div key={label} className="bloque-row">
                        <div className="bloque-row-top">
                          <span className="bloque-name">{label}</span>
                          <span className="bloque-count">{seen}/{t} · {pct}%</span>
                        </div>
                        <div className="stat-bar">
                          <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── TEMAS ── */}
          {tab === 'temas' && (
            <div className="stats-section">
              <div className="topic-list">
                {temaRows.map(([tema, t]) => {
                  const attempts = t.correctas + t.fallos
                  const coverage = Math.round((t.seen / t.total) * 100)
                  const accPct   = attempts > 0 ? Math.round((t.correctas / attempts) * 100) : null
                  const accColor = accPct === null ? 'var(--text-muted)'
                    : accPct >= 60 ? 'var(--success)' : 'var(--error)'
                  return (
                    <div key={tema} className="topic-row">
                      <div className="topic-row-header">
                        <span className="topic-name">
                          {t.fallos > 2 && <span className="topic-fail-badge">!</span>}
                          {tema}
                        </span>
                      </div>
                      <div className="stat-bar">
                        <div className="stat-bar-fill" style={{ width: `${coverage}%` }} />
                      </div>
                      <div className="topic-stats">
                        <span className="topic-stat">
                          <span className="topic-stat-label">Vistas</span>
                          <span className="topic-stat-val">{t.seen}/{t.total} <em>({coverage}%)</em></span>
                        </span>
                        {attempts > 0 && <>
                          <span className="topic-stat">
                            <span className="topic-stat-label">Aciertos</span>
                            <span className="topic-stat-val topic-stat-ok">✓ {t.correctas}</span>
                          </span>
                          <span className="topic-stat">
                            <span className="topic-stat-label">Fallos</span>
                            <span className="topic-stat-val topic-stat-err">✗ {t.fallos}</span>
                          </span>
                          <span className="topic-stat">
                            <span className="topic-stat-label">Precisión</span>
                            <span className="topic-stat-val" style={{ color: accColor, fontWeight: 700 }}>{accPct}%</span>
                          </span>
                        </>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {tab === 'historial' && (
            <div className="stats-section">
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Todavía no hay sesiones registradas.</p>
              ) : (
                <>
                  {history.length >= 2 && <TrendChart history={history} />}
                  <div className="history-list" style={{ marginTop: history.length >= 2 ? '1rem' : 0 }}>
                    {history.map((h, i) => {
                      const pct  = Math.round(h.score / h.total * 100)
                      const pass = pct >= 60
                      return (
                        <div key={i} className={`history-row ${pass ? 'history-row-ok' : 'history-row-fail'}`}>
                          <div className="history-row-left">
                            <span className="history-row-date">
                              {new Date(h.date).toLocaleDateString('es-ES', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className="history-row-meta">{h.bloque} · {h.modo} · {h.total} preguntas</span>
                          </div>
                          <div className="history-row-right">
                            <span className={`history-row-pct ${pass ? 'score-ok' : 'score-fail'}`}>{pct}%</span>
                            <span className="history-row-detail">{h.score}/{h.total}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// SVG trend line chart — sessions in chronological order
function TrendChart({ history }) {
  const data = [...history].reverse() // oldest → newest
  const scores = data.map(h => Math.round(h.score / h.total * 100))

  const W = 500, H = 130
  const PAD = { top: 12, right: 12, bottom: 28, left: 32 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  const xOf = i => PAD.left + (data.length === 1 ? iW / 2 : (i / (data.length - 1)) * iW)
  const yOf = v => PAD.top + iH - (v / 100) * iH
  const ref60 = yOf(60)

  const linePts = scores.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ')

  const areaD =
    `M${xOf(0)},${yOf(scores[0])}` +
    scores.slice(1).map((v, i) => ` L${xOf(i + 1)},${yOf(v)}`).join('') +
    ` L${xOf(data.length - 1)},${PAD.top + iH} L${xOf(0)},${PAD.top + iH} Z`

  // Y axis ticks
  const yTicks = [0, 60, 100]

  // X axis: show up to 6 evenly spaced labels
  const xLabelCount = Math.min(data.length, 6)
  const xLabelIdxs = data.length === 1
    ? [0]
    : Array.from({ length: xLabelCount }, (_, i) => Math.round((i / (xLabelCount - 1)) * (data.length - 1)))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Y grid + labels */}
      {yTicks.map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={yOf(v)}
            x2={W - PAD.right} y2={yOf(v)}
            stroke={v === 60 ? '#f87171' : 'var(--border)'}
            strokeWidth={v === 60 ? 1.5 : 1}
            strokeDasharray={v === 60 ? '5 3' : undefined}
          />
          <text x={PAD.left - 5} y={yOf(v) + 4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{v}%</text>
        </g>
      ))}
      <text x={W - PAD.right + 2} y={yOf(60) + 4} fontSize="8" fill="#f87171">aprobado</text>

      {/* Area fill */}
      <path d={areaD} fill="var(--primary)" fillOpacity="0.08" />

      {/* Line */}
      <polyline
        points={linePts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {scores.map((v, i) => (
        <circle
          key={i}
          cx={xOf(i)} cy={yOf(v)} r="3.5"
          fill={v >= 60 ? 'var(--success)' : 'var(--error)'}
          stroke="var(--surface)" strokeWidth="1.5"
        />
      ))}

      {/* X axis labels */}
      {xLabelIdxs.map(i => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          {new Date(data[i].date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
        </text>
      ))}
    </svg>
  )
}

// CSS ring chart using conic-gradient
function RingChart({ pct, color }) {
  return (
    <div className="ring-chart" style={{ '--pct': `${pct}%`, '--color': color }}>
      <div className="ring-inner">
        <span className="ring-label" style={{ color }}>{pct}%</span>
      </div>
    </div>
  )
}
