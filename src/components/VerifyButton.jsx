export default function VerifyButton({ question }) {
  function buildPrompt(q) {
    const opts = q.opciones.map(o => `${o.letra.toUpperCase()}) ${o.texto}`).join(' | ')
    return (
      `Pregunta de oposición Técnico/a Superior Informática Osakidetza. ` +
      `Indica la letra correcta (a/b/c/d) y explica brevemente por qué. ` +
      `Pregunta ${q.num_bloque}: ${q.enunciado} — Opciones: ${opts}`
    )
  }

  function handleClick() {
    const prompt = buildPrompt(question)
    // ?q= pre-rellena el input de ChatGPT y lo envía automáticamente
    const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button className="btn-verify" onClick={handleClick} title="Abre ChatGPT con la pregunta ya cargada">
      🤖 Verificar con IA
    </button>
  )
}
