import { useState } from 'react'
import VerifyButton from './VerifyButton'

const IMAGE_REF = /según el diagrama|según la figura|según el esquema|según la imagen|en la figura|la figura anterior|el diagrama anterior|el esquema anterior|véase la figura|se muestra en|mostrado en la figura/i

export default function QuizCard({ session, onAnswer, onNext, onFinish, onExit }) {
  const { questions, current, answers, modo } = session
  const [confirmExit, setConfirmExit] = useState(false)

  const q = questions[current]
  const isLast = current >= questions.length - 1
  const selectedAnswer = answers[q.id]
  const isAnswered = !!selectedAnswer
  const isEstudio = modo === 'estudio'
  const correctAnswer = q.respuesta_estimada

  function optionClass(letra) {
    if (isEstudio && isAnswered) {
      if (letra === correctAnswer) return 'option correct'
      if (letra === selectedAnswer) return 'option wrong'
      return 'option dim'
    }
    return selectedAnswer === letra ? 'option selected' : 'option'
  }

  return (
    <div className="quiz">
      <div className="quiz-header">
        <span className="progress-text">{current + 1} / {questions.length}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="badge badge-bloque">
          {q.bloque === 'especifico' ? 'Específico' : 'Común'}
        </span>
        <button
          className="btn-exit-quiz"
          onClick={() => setConfirmExit(true)}
          title="Salir del test"
        >
          ✕ Salir
        </button>
      </div>

      {confirmExit && (
        <div className="exit-confirm">
          <span>¿Salir del test? El progreso de esta sesión no se guardará.</span>
          <div className="exit-confirm-actions">
            <button className="btn-cancel" onClick={() => setConfirmExit(false)}>Cancelar</button>
            <button className="btn-danger" onClick={onExit}>Salir de todos modos</button>
          </div>
        </div>
      )}

      <p className="badge-tema-inline">{q.tema}</p>

      <div className="question-card">
        {IMAGE_REF.test(q.enunciado) && (
          <div className="image-ref-notice">
            <span>⚠️</span>
            <span>Esta pregunta hace referencia a un diagrama o figura del examen que no está disponible en formato texto. Consulta el PDF original para ver el visual.</span>
          </div>
        )}

        <p className="question-text">
          <span className="question-num">{q.num_bloque}.</span> {q.enunciado}
        </p>

        <div className="options">
          {q.opciones.map(o => (
            <button
              key={o.letra}
              className={optionClass(o.letra)}
              onClick={() => !isAnswered && onAnswer(q.id, o.letra)}
            >
              <span className="option-letra">{o.letra.toUpperCase()}</span>
              <span className="option-texto">{o.texto}</span>
            </button>
          ))}
        </div>

        {isEstudio && isAnswered && (
          <div className={`feedback ${selectedAnswer === correctAnswer ? 'feedback-ok' : 'feedback-error'}`}>
            {selectedAnswer === correctAnswer
              ? '✓ Correcto'
              : `✗ Respuesta estimada: ${correctAnswer?.toUpperCase()}`
            }
            {q.confianza && (
              <span className="confianza"> · confianza {q.confianza}</span>
            )}
          </div>
        )}

        <div className="quiz-actions">
          <VerifyButton question={q} />

          {isAnswered && (
            isLast
              ? <button className="btn-primary" onClick={onFinish}>Ver resultados →</button>
              : <button className="btn-primary" onClick={onNext}>Siguiente →</button>
          )}

          {!isAnswered && !isEstudio && (
            <span className="hint-text">Selecciona una opción</span>
          )}
        </div>
      </div>

      {!isEstudio && (
        <div className="examen-footer">
          <span>{Object.keys(answers).length} / {questions.length} respondidas</span>
          {isLast && isAnswered && (
            <button className="btn-primary" onClick={onFinish}>Finalizar y ver resultados →</button>
          )}
        </div>
      )}
    </div>
  )
}
