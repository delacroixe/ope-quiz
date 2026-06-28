import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Sidebar, { MenuIcon } from './components/Sidebar'
import FilterBar from './components/FilterBar'
import QuizCard from './components/QuizCard'
import Results from './components/Results'
import Stats from './components/Stats'
import Profile from './components/Profile'

const HISTORY_KEY = 'ope_quiz_history'
const STATS_KEY   = 'ope_question_stats'
const SESSION_KEY = 'ope_quiz_session'
const PROFILE_KEY = 'ope_quiz_profile'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}') }
  catch { return {} }
}

export default function App() {
  const [allQuestions, setAllQuestions]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [screen, setScreen]               = useState('home')
  const [questionStats, setQuestionStats] = useState(loadStats)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [user, setUser]                   = useState(null)
  const [config, setConfig] = useState({
    bloque: 'todos',
    tema: 'todos',
    n: 20,
    modo: 'estudio',
  })
  const [session, setSession] = useState(null)

  // ── Load questions ──────────────────────────────────────────────
  useEffect(() => {
    fetch('/questions.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => {
        setAllQuestions(d.preguntas || [])
        setLoading(false)
        try {
          const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
          if (saved?.session && saved?.screen === 'quiz') {
            setSession(saved.session)
            setScreen('quiz')
          }
        } catch {}
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  // ── Supabase: load user data after login ────────────────────────
  const loadUserData = useCallback(async (userId) => {
    if (!supabase) return

    const [{ data: remoteStats }, { data: remoteSessions }, { data: remoteProfile }] =
      await Promise.all([
        supabase.from('question_stats')
          .select('question_id, vistas, correctas, fallos')
          .eq('user_id', userId),
        supabase.from('sessions')
          .select('date, total, score, bloque, modo')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(30),
        supabase.from('profiles')
          .select('nombre, fecha_examen, meta_diaria')
          .eq('id', userId)
          .maybeSingle(),
      ])

    if (remoteStats?.length) {
      const statsObj = {}
      remoteStats.forEach(s => {
        statsObj[s.question_id] = { vistas: s.vistas, correctas: s.correctas, fallos: s.fallos }
      })
      setQuestionStats(statsObj)
      localStorage.setItem(STATS_KEY, JSON.stringify(statsObj))
    }

    if (remoteSessions?.length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(remoteSessions))
    }

    if (remoteProfile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        nombre:      remoteProfile.nombre,
        fechaExamen: remoteProfile.fecha_examen,
        metaDiaria:  remoteProfile.meta_diaria,
      }))
    }
  }, [])

  // ── Supabase: auth listener ─────────────────────────────────────
  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) { setUser(s.user); loadUserData(s.user.id) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      const u = s?.user ?? null
      setUser(u)
      if (event === 'SIGNED_IN' && u) loadUserData(u.id)
    })

    return () => subscription.unsubscribe()
  }, [loadUserData])

  // ── Persist active quiz session ─────────────────────────────────
  useEffect(() => {
    if (screen === 'quiz' && session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ session, screen }))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [session, screen])

  // ── Derived state ───────────────────────────────────────────────
  const topics = [...new Set(
    allQuestions
      .filter(q => config.bloque === 'todos' || q.bloque === config.bloque)
      .map(q => q.tema)
  )].sort()

  const filteredPool = allQuestions
    .filter(q => config.bloque === 'todos' || q.bloque === config.bloque)
    .filter(q => config.tema === 'todos' || q.tema === config.tema)

  // ── Smart pool: 70% unseen + 30% most-failed ───────────────────
  function buildSmartPool(pool, n) {
    const unseen = shuffle(pool.filter(q => !questionStats[q.id]))
    const failed = pool
      .filter(q => questionStats[q.id]?.fallos > 0)
      .sort((a, b) => {
        const rA = questionStats[a.id].fallos / questionStats[a.id].vistas
        const rB = questionStats[b.id].fallos / questionStats[b.id].vistas
        return rB - rA
      })
    const nFailed = Math.min(Math.ceil(n * 0.3), failed.length)
    const nUnseen = Math.min(n - nFailed, unseen.length)
    let selected = [...failed.slice(0, nFailed), ...unseen.slice(0, nUnseen)]
    if (selected.length < n) {
      const usedIds = new Set(selected.map(q => q.id))
      const rest = shuffle(pool.filter(q => !usedIds.has(q.id)))
      selected = [...selected, ...rest.slice(0, n - selected.length)]
    }
    return shuffle(selected)
  }

  // ── Quiz actions ────────────────────────────────────────────────
  function startQuiz() {
    const pool = buildSmartPool(filteredPool, config.n)
    if (pool.length === 0) { alert('No hay preguntas con los filtros seleccionados.'); return }
    setSession({ questions: pool, current: 0, answers: {}, startTime: Date.now(), modo: config.modo })
    setScreen('quiz')
  }

  function handleAnswer(questionId, letra) {
    setSession(prev => {
      if (prev.modo === 'estudio' && prev.answers[questionId]) return prev
      return { ...prev, answers: { ...prev.answers, [questionId]: letra } }
    })
  }

  function handleNext() {
    setSession(prev => ({ ...prev, current: prev.current + 1 }))
  }

  async function handleFinish() {
    const endTime = Date.now()

    // Update per-question stats
    const newStats = { ...questionStats }
    session.questions.forEach(q => {
      const ans = session.answers[q.id]
      if (!ans) return
      if (!newStats[q.id]) newStats[q.id] = { vistas: 0, correctas: 0, fallos: 0 }
      newStats[q.id].vistas++
      if (ans === q.respuesta_estimada) newStats[q.id].correctas++
      else newStats[q.id].fallos++
    })
    setQuestionStats(newStats)
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats))

    // Save session to history
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const score = session.questions.reduce(
      (acc, q) => acc + (session.answers[q.id] === q.respuesta_estimada ? 1 : 0), 0
    )
    const newEntry = {
      date: new Date().toISOString(),
      total: session.questions.length,
      score,
      bloque: config.bloque,
      modo: session.modo,
    }
    history.unshift(newEntry)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)))

    // Sync to Supabase if logged in
    if (supabase && user) {
      const statsRows = Object.entries(newStats).map(([qId, s]) => ({
        user_id: user.id, question_id: parseInt(qId), ...s,
      }))
      await Promise.all([
        supabase.from('question_stats').upsert(statsRows, { onConflict: 'user_id,question_id' }),
        supabase.from('sessions').insert({ user_id: user.id, ...newEntry }),
      ])
    }

    setSession(prev => ({ ...prev, endTime }))
    setScreen('results')
  }

  function handleExit()    { setSession(null); setScreen('home') }
  function handleRestart() { setSession(null); setScreen('home') }
  function navigate(s)     { setScreen(s); setSidebarOpen(false) }

  // ── Render ──────────────────────────────────────────────────────
  if (loading) return <div className="loading">Cargando preguntas…</div>
  if (error)   return <div className="loading error">Error: {error}</div>

  if (screen === 'quiz') return (
    <QuizCard session={session} onAnswer={handleAnswer} onNext={handleNext} onFinish={handleFinish} onExit={handleExit} />
  )
  if (screen === 'results') return (
    <Results session={session} onRestart={handleRestart} />
  )

  return (
    <div className="app-layout">
      <Sidebar current={screen} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <div className="mobile-bar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            <MenuIcon />
          </button>
          <span className="mobile-bar-title">OPE Quiz</span>
        </div>

        {screen === 'home' && (
          <FilterBar
            config={config} setConfig={setConfig}
            topics={topics} total={allQuestions.length} filtered={filteredPool.length}
            onStart={startQuiz}
          />
        )}
        {screen === 'stats'   && <Stats allQuestions={allQuestions} questionStats={questionStats} />}
        {screen === 'profile' && <Profile user={user} />}
      </div>
    </div>
  )
}
