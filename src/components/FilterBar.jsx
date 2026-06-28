export default function FilterBar({
  config, setConfig, topics, total, filtered, onStart,
}) {
  return (
    <div className="home">
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
            <select
              value={config.n}
              onChange={e => setConfig(c => ({ ...c, n: parseInt(e.target.value) }))}
            >
              {[5, 10, 15, 20, 30, 40, 60, 80, 100].map(n => (
                <option key={n} value={n} disabled={n > filtered}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="pool-info">
          <strong>{filtered}</strong> preguntas disponibles · {total} en total
        </p>

        <button className="btn-primary btn-lg" onClick={onStart} disabled={filtered === 0}>
          Empezar →
        </button>
      </div>
    </div>
  )
}
