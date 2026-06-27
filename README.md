# OPE Quiz – Osakidetza

App web de estudio tipo test para la OPE de **Técnico/a Superior de Informática de Osakidetza** (País Vasco).

## Arranque rápido

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Servidor de desarrollo → http://localhost:5173
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview
```

## Estructura del proyecto

```
ope/
├── public/
│   ├── questions.json          ← Banco de 700 preguntas con respuestas estimadas por IA
│   ├── answers.csv             ← CSV editable para cargar respuestas en bloque
│   └── answers_template.csv   ← Plantilla vacía generada automáticamente
├── src/
│   ├── App.jsx                 ← Lógica principal: carga de datos, gestión de pantallas
│   ├── index.css               ← Estilos completos
│   └── components/
│       ├── FilterBar.jsx       ← Pantalla de inicio: filtros por bloque, tema, modo
│       ├── QuizCard.jsx        ← Pregunta con opciones y feedback
│       ├── Results.jsx         ← Resultados con revisión pregunta a pregunta
│       └── VerifyButton.jsx    ← Copia prompt al portapapeles y abre ChatGPT
├── scripts/
│   ├── parse_questions.py      ← Extrae preguntas de los PDFs → questions.json
│   └── apply_answers.py        ← Aplica respuestas desde CSV al JSON
├── PDF/                        ← PDFs originales de la OPE
├── package.json
└── vite.config.js
```

## Funcionalidades de la app

- **Modo estudio**: feedback inmediato tras cada respuesta (verde/rojo)
- **Modo examen**: sin feedback hasta el final
- **Filtros**: bloque (específico / común), tema, estado de la respuesta
- **Historial**: últimas 30 sesiones guardadas en `localStorage`
- **Verificar con IA**: copia el prompt de la pregunta y abre ChatGPT para verificar la respuesta estimada

## Estado del banco de preguntas

| Bloque | Preguntas | Respuestas |
|---|---|---|
| Específico (informática) | 500 | ✓ estimadas por IA |
| Común (jurídico/sanitario) | 200 | ✓ estimadas por IA |
| **Total** | **700** | **700** |

Las respuestas tienen estado `estimada` y confianza `alta`. Pueden verificarse pregunta a pregunta con el botón integrado en la app.

## Estructura de `questions.json`

```json
{
  "id": 1,
  "num_bloque": 1,
  "bloque": "especifico",
  "tema": "Redes – Modelo OSI y TCP/IP",
  "enunciado": "¿Qué capa del modelo OSI se relaciona con la transmisión de bits...?",
  "opciones": [
    { "letra": "a", "texto": "Enlace." },
    { "letra": "b", "texto": "Transporte." },
    { "letra": "c", "texto": "Física." },
    { "letra": "d", "texto": "Red." }
  ],
  "respuesta_estimada": "c",
  "confianza": "alta",
  "estado": "estimada",
  "respuesta_verificada": null
}
```

Estados posibles: `pendiente` · `estimada` · `verificada` · `dudosa`

## Scripts de datos (Python)

Requieren `pypdf`:

```bash
pip3 install pypdf
```

### Regenerar el JSON desde los PDFs

```bash
python3 scripts/parse_questions.py
```

### Cargar respuestas en bloque desde CSV

1. Edita `public/answers.csv`:

```csv
bloque,num_bloque,respuesta
especifico,1,c
comun,1,d
```

2. Ejecuta:

```bash
python3 scripts/apply_answers.py
```
