export default function FilterBar({ config, setConfig, topics, total, filtered, onStart }) {
  const history = JSON.parse(localStorage.getItem('ope_quiz_history') || '[]')

  return (
    <div className="home">
      <header className="home-header">
        <h1>OPE Quiz</h1>
        <p>Técnico/a Superior Informática · Osakidetza</p>
      </header>

      <div className="filter-card">
        <div className="filter-grid">
          <label>
            Bloque
            <select
              value={config.bloque}
              onChange={e => setConfig(c => ({ ...c, bloque: e.target.value, tema: 'todos' }))}
            >
              <option value="todos">Todos</option>
              <option value="especifico">Específico (informática)</option>
              <option value="comun">Común (jurídico/sanitario)</option>
            </select>
          </label>

          <label>
            Tema
            <select
              value={config.tema}
              onChange={e => setConfig(c => ({ ...c, tema: e.target.value }))}
            >
              <option value="todos">Todos los temas</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label>
            Estado
            <select
              value={config.estado}
              onChange={e => setConfig(c => ({ ...c, estado: e.target.value }))}
            >
              <option value="todos">Todos</option>
              <option value="estimada">Estimada (IA)</option>
              <option value="verificada">Verificada</option>
              <option value="dudosa">Dudosa</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </label>

          <label>
            Modo
            <select
              value={config.modo}
              onChange={e => setConfig(c => ({ ...c, modo: e.target.value }))}
            >
              <option value="estudio">Estudio (feedback inmediato)</option>
              <option value="examen">Examen (resultado al final)</option>
            </select>
          </label>

          <label>
            Número de preguntas
            <input
              type="number"
              min={1}
              max={filtered || 1}
              value={config.n}
              onChange={e => setConfig(c => ({ ...c, n: Math.max(1, parseInt(e.target.value) || 1) }))}
            />
          </label>
        </div>

        <p className="pool-info">
          <strong>{filtered}</strong> preguntas disponibles con los filtros actuales · {total} en total
        </p>

        <button className="btn-primary btn-lg" onClick={onStart} disabled={filtered === 0}>
          Empezar →
        </button>
      </div>

      {history.length > 0 && (
        <div className="history-card">
          <h3>Últimas sesiones</h3>
          <table className="history-table">
            <thead>
              <tr><th>Fecha</th><th>Bloque</th><th>Modo</th><th>Resultado</th></tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{h.bloque}</td>
                  <td>{h.modo}</td>
                  <td className={h.score / h.total >= 0.6 ? 'score-ok' : 'score-fail'}>
                    {h.score}/{h.total} ({Math.round(h.score / h.total * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
