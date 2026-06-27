import { useState, useEffect } from 'react'
import FilterBar from './components/FilterBar'
import QuizCard from './components/QuizCard'
import Results from './components/Results'

const HISTORY_KEY = 'ope_quiz_history'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function App() {
  const [allQuestions, setAllQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [screen, setScreen] = useState('home') // 'home' | 'quiz' | 'results'
  const [config, setConfig] = useState({
    bloque: 'todos',
    tema: 'todos',
    estado: 'todos',
    n: 20,
    modo: 'estudio', // 'estudio' | 'examen'
  })
  const [session, setSession] = useState(null)
  // session: { questions, current, answers: {id: letra}, startTime, modo }

  useEffect(() => {
    fetch('/questions.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        setAllQuestions(d.preguntas || [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // Topics filtered by current bloque selection
  const topics = [...new Set(
    allQuestions
      .filter(q => config.bloque === 'todos' || q.bloque === config.bloque)
      .map(q => q.tema)
  )].sort()

  // Pool size for current filters
  const filteredPool = allQuestions
    .filter(q => config.bloque === 'todos' || q.bloque === config.bloque)
    .filter(q => config.tema === 'todos' || q.tema === config.tema)
    .filter(q => config.estado === 'todos' || q.estado === config.estado)

  function startQuiz() {
    const pool = shuffle(filteredPool).slice(0, Math.min(config.n, filteredPool.length))
    if (pool.length === 0) {
      alert('No hay preguntas con los filtros seleccionados.')
      return
    }
    setSession({
      questions: pool,
      current: 0,
      answers: {},
      startTime: Date.now(),
      modo: config.modo,
    })
    setScreen('quiz')
  }

  function handleAnswer(questionId, letra) {
    setSession(prev => {
      // Lock answer in estudio mode; allow changing in examen mode before Next
      if (prev.modo === 'estudio' && prev.answers[questionId]) return prev
      return { ...prev, answers: { ...prev.answers, [questionId]: letra } }
    })
  }

  function handleNext() {
    setSession(prev => ({ ...prev, current: prev.current + 1 }))
  }

  function handleFinish() {
    const endTime = Date.now()
    // Persist to history
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const score = session.questions.reduce((acc, q) => {
      return acc + (session.answers[q.id] === q.respuesta_estimada ? 1 : 0)
    }, 0)
    history.unshift({
      date: new Date().toISOString(),
      total: session.questions.length,
      score,
      bloque: config.bloque,
      modo: session.modo,
    })
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)))
    setSession(prev => ({ ...prev, endTime }))
    setScreen('results')
  }

  function handleRestart() {
    setSession(null)
    setScreen('home')
  }

  if (loading) return <div className="loading">Cargando preguntas…</div>
  if (error) return <div className="loading error">Error al cargar las preguntas: {error}</div>

  if (screen === 'home') return (
    <FilterBar
      config={config}
      setConfig={setConfig}
      topics={topics}
      total={allQuestions.length}
      filtered={filteredPool.length}
      onStart={startQuiz}
    />
  )

  if (screen === 'quiz') return (
    <QuizCard
      session={session}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onFinish={handleFinish}
    />
  )

  if (screen === 'results') return (
    <Results session={session} onRestart={handleRestart} />
  )
}
