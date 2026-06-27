"""
Aplica respuestas al questions.json a partir de un CSV.

CSV esperado (cabecera obligatoria):
  bloque,num_bloque,respuesta

Ejemplo:
  especifico,1,c
  comun,1,d
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
QUESTIONS_PATH = ROOT / "public" / "questions.json"
ANSWERS_CSV_PATH = ROOT / "public" / "answers.csv"
TEMPLATE_CSV_PATH = ROOT / "public" / "answers_template.csv"

VALID_BLOQUES = {"especifico", "comun"}
VALID_RESP = {"a", "b", "c", "d"}


def build_template(questions: list[dict]) -> None:
    TEMPLATE_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with TEMPLATE_CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["bloque", "num_bloque", "respuesta", "enunciado"])
        for q in questions:
            w.writerow([q["bloque"], q["num_bloque"], "", q["enunciado"]])


def load_answers() -> dict[tuple[str, int], str]:
    if not ANSWERS_CSV_PATH.exists():
        return {}

    answers: dict[tuple[str, int], str] = {}
    with ANSWERS_CSV_PATH.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {"bloque", "num_bloque", "respuesta"}
        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError(
                "answers.csv debe contener cabeceras: bloque,num_bloque,respuesta"
            )

        for i, row in enumerate(reader, start=2):
            bloque = (row.get("bloque") or "").strip().lower()
            num_raw = (row.get("num_bloque") or "").strip()
            resp = (row.get("respuesta") or "").strip().lower()

            if not bloque or not num_raw or not resp:
                continue
            if bloque not in VALID_BLOQUES:
                raise ValueError(f"Fila {i}: bloque inválido '{bloque}'")
            if resp not in VALID_RESP:
                raise ValueError(f"Fila {i}: respuesta inválida '{resp}'")
            try:
                num = int(num_raw)
            except ValueError as exc:
                raise ValueError(f"Fila {i}: num_bloque inválido '{num_raw}'") from exc

            answers[(bloque, num)] = resp

    return answers


def main() -> None:
    if not QUESTIONS_PATH.exists():
        raise FileNotFoundError(f"No existe {QUESTIONS_PATH}")

    data = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    questions = data.get("preguntas", [])

    build_template(questions)

    answers = load_answers()
    if not answers:
        print("No se encontró public/answers.csv o está vacío.")
        print(f"Plantilla generada: {TEMPLATE_CSV_PATH}")
        return

    applied = 0
    missing_keys = []
    index = {(q["bloque"], int(q["num_bloque"])): q for q in questions}

    for key, resp in answers.items():
        q = index.get(key)
        if not q:
            missing_keys.append(key)
            continue
        q["respuesta"] = resp
        applied += 1

    QUESTIONS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"Respuestas aplicadas: {applied}")
    if missing_keys:
        print(f"Claves no encontradas en questions.json: {len(missing_keys)}")
        print("Primeras 10:", missing_keys[:10])


if __name__ == "__main__":
    main()
