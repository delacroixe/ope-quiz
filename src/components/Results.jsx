import VerifyButton from './VerifyButton'

export default function Results({ session, onRestart }) {
  const { questions, answers, startTime, endTime, modo } = session
  const elapsed = Math.round(((endTime || Date.now()) - startTime) / 1000)
  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')

  const results = questions.map(q => ({
    ...q,
    userAnswer: answers[q.id] || null,
    isCorrect: !!answers[q.id] && answers[q.id] === q.respuesta_estimada,
  }))

  const score = results.filter(r => r.isCorrect).length
  const total = results.length
  const pct = Math.round((score / total) * 100)
  const passColor = pct >= 60 ? 'var(--success)' : 'var(--error)'

  return (
    <div className="results">
      <div className="results-header">
        <h2>Resultados</h2>

        <div className="score-ring" style={{ '--fill': `${pct}%`, '--color': passColor }}>
          <div className="score-inner">
            <span className="score-pct" style={{ color: passColor }}>{pct}%</span>
          </div>
        </div>

        <p className="score-detail">
          {score} / {total} correctas · {mins}:{secs} min · modo {modo}
        </p>

        {pct >= 60
          ? <p className="score-msg ok">¡Bien hecho! Superas el 60%</p>
          : <p className="score-msg fail">Por debajo del 60% — sigue practicando</p>
        }

        <button className="btn-primary btn-lg" style={{ marginTop: '1rem' }} onClick={onRestart}>
          ← Volver al inicio
        </button>
      </div>

      <h3 className="review-title">Revisión de respuestas</h3>

      <div className="review-list">
        {results.map((r, i) => (
          <div key={r.id} className={`review-item ${r.isCorrect ? 'review-ok' : 'review-error'}`}>
            <span className="review-icon">{r.isCorrect ? '✓' : '✗'}</span>

            <div className="review-content">
              <p className="review-num-text">
                <strong>{i + 1}.</strong> {r.enunciado}
              </p>

              <div className="review-options">
                {r.opciones.map(o => (
                  <span
                    key={o.letra}
                    className={
                      o.letra === r.respuesta_estimada
                        ? 'ropt correct'
                        : o.letra === r.userAnswer && !r.isCorrect
                        ? 'ropt wrong'
                        : 'ropt'
                    }
                  >
                    <strong>{o.letra.toUpperCase()})</strong> {o.texto}
                  </span>
                ))}
              </div>

              {!r.isCorrect && r.respuesta_estimada && (
                <p className="review-hint">
                  Respuesta estimada: <strong>{r.respuesta_estimada.toUpperCase()}</strong>
                  {r.confianza && ` · confianza ${r.confianza}`}
                  {r.userAnswer === null && ' · sin responder'}
                </p>
              )}

              <VerifyButton question={r} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
