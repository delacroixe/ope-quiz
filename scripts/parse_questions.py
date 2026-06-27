"""
Parser de preguntas de oposición Técnico/a Superior Informática – Osakidetza.
Extrae todas las preguntas de los PDFs y genera questions.json.
"""
import pypdf
import re
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent

# ---------------------------------------------------------------------------
# Temas del bloque específico de informática (por rangos de pregunta)
# Inferidos del temario bibliográfico oficial
# ---------------------------------------------------------------------------
TEMAS_ESPECIFICO = {
    range(1, 51):    "Redes – Modelo OSI y TCP/IP",
    range(51, 101):  "Redes – Direccionamiento y protocolos",
    range(101, 151): "Redes – Equipos y tecnologías de red",
    range(151, 201): "Bases de datos",
    range(201, 241): "SAP S/4HANA",
    range(241, 281): "Agile, Scrum y gestión de proyectos",
    range(281, 321): "ITIL 4",
    range(321, 371): "Ingeniería del software",
    range(371, 421): "Ciberseguridad",
    range(421, 471): "PKI, firma digital y certificados",
    range(471, 501): "Big Data y Cloud computing",
}

TEMAS_COMUN = {
    range(1, 31):    "Ordenación profesiones sanitarias – Ley 44/2003",
    range(31, 61):   "Sistema Nacional de Salud – Ley 16/2003",
    range(61, 91):   "Estatuto Marco – Ley 55/2003",
    range(91, 121):  "Osakidetza – Estructura y organización",
    range(121, 141): "Derechos y deberes del paciente",
    range(141, 161): "Protección de datos – LO 3/2018",
    range(161, 181): "Igualdad y violencia de género",
    range(181, 201): "Planes estratégicos Euskadi / Osakidetza",
}


def get_tema(num: int, bloque: str) -> str:
    mapa = TEMAS_ESPECIFICO if bloque == "especifico" else TEMAS_COMUN
    for rango, tema in mapa.items():
        if num in rango:
            return tema
    return "General"


def extract_text(pdf_path: Path) -> str:
    reader = pypdf.PdfReader(str(pdf_path))
    parts = []
    for page in reader.pages:
        t = page.extract_text() or ""
        parts.append(t)
    return "\n".join(parts)


def clean(text: str) -> str:
    """Elimina saltos de línea internos y espacios múltiples."""
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def parse_questions(text: str, bloque: str, id_offset: int) -> list:
    """
    Extrae preguntas con un patrón global robusto, tolerante a saltos de
    página y espacios intermedios.
    """
    questions = []
    q_pattern = re.compile(
        r"(?ms)^\s*(\d{1,3})\.-\s+"          # número
        r"(.*?)"                               # enunciado
        r"\n\s*a\)\s*(.*?)"                    # opción a
        r"\n\s*b\)\s*(.*?)"                    # opción b
        r"\n\s*c\)\s*(.*?)"                    # opción c
        r"\n\s*d\)\s*(.*?)"                    # opción d
        r"(?=\n\s*\d{1,3}\.-\s|\Z)"          # siguiente pregunta o fin
    )

    for m in q_pattern.finditer(text):
        num = int(m.group(1))
        enunciado = clean(m.group(2))
        opts = [clean(m.group(i)) for i in range(3, 7)]

        # Evita descartar preguntas válidas de enunciado corto (p. ej. "ICMP es:").
        if len(enunciado) < 3:
            continue

        questions.append(
            {
                "id": id_offset + num,
                "num_bloque": num,
                "bloque": bloque,
                "tema": get_tema(num, bloque),
                "enunciado": enunciado,
                "opciones": [
                    {"letra": "a", "texto": opts[0]},
                    {"letra": "b", "texto": opts[1]},
                    {"letra": "c", "texto": opts[2]},
                    {"letra": "d", "texto": opts[3]},
                ],
                # respuesta_estimada: letra generada por IA (a/b/c/d), null si no rellenada
                "respuesta_estimada": None,
                # confianza: "alta" | "media" | "baja" | null
                "confianza": None,
                # estado: "pendiente" | "estimada" | "verificada" | "dudosa"
                "estado": "pendiente",
                # respuesta_verificada: letra confirmada por fuente oficial, null hasta verificar
                "respuesta_verificada": None,
            }
        )

    return questions


def main():
    all_questions = []

    # ── Bloque específico (500 preguntas) ────────────────────────────────────
    tec_pdf = ROOT / "PDF" / "TEC SUPERIOR INFORMATICA_cas.pdf"
    print(f"Parseando {tec_pdf.name}...")
    tec_text = extract_text(tec_pdf)
    tec_qs = parse_questions(tec_text, bloque="especifico", id_offset=0)
    print(f"  → {len(tec_qs)} preguntas extraídas")
    all_questions.extend(tec_qs)

    # ── Bloque común (200 preguntas) ─────────────────────────────────────────
    comun_pdf = ROOT / "PDF" / "200 Galdera-sorta_TEMARIO COMUN_cas(13).pdf"
    print(f"Parseando {comun_pdf.name}...")
    comun_text = extract_text(comun_pdf)
    comun_qs = parse_questions(comun_text, bloque="comun", id_offset=500)
    print(f"  → {len(comun_qs)} preguntas extraídas")
    all_questions.extend(comun_qs)

    # ── Guardar JSON ─────────────────────────────────────────────────────────
    out = {
        "meta": {
            "nombre": "Oposición Técnico/a Superior Informática – Osakidetza",
            "generado": "2026-06-27",
            "total": len(all_questions),
            "especifico": len(tec_qs),
            "comun": len(comun_qs),
        },
        "preguntas": all_questions,
    }

    out_path = ROOT / "public" / "questions.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"\n✓ Guardado en {out_path}")
    print(f"  Total: {len(all_questions)} preguntas")


if __name__ == "__main__":
    main()
