"""Validación del esquema YAML de lecciones (espejo del validador del frontend)."""

import yaml

# Espejo del registro del frontend (frontend/src/lib/languages.ts)
VALID_LANGUAGES = {"en", "pt"}
VALID_LESSON_TYPES = {"vocabulary", "phonetics", "grammar", "reading", "conversation"}
VALID_EXERCISE_TYPES = {"fill_blank", "translate", "multiple_choice", "reorder"}


def validate_lesson(yaml_content: str) -> dict:
    """Parsea y valida una lección YAML.

    Devuelve {valid, errors, lesson, stats}. `lesson` es None si el YAML
    no se pudo parsear como mapping.
    """
    try:
        lesson = yaml.safe_load(yaml_content)
    except yaml.YAMLError as exc:
        return _result(False, [f"YAML inválido: {exc}"], None)

    if not isinstance(lesson, dict):
        return _result(False, ["El YAML debe ser un mapping con los campos de la lección"], None)

    errors: list[str] = []

    if not lesson.get("title"):
        errors.append('Falta el campo "title"')
    language = lesson.get("language")
    valid_langs = " | ".join(sorted(VALID_LANGUAGES))
    if not language:
        errors.append(f'Falta el campo "language" ({valid_langs})')
    elif language not in VALID_LANGUAGES:
        errors.append(f'"language" debe ser {valid_langs}, no "{language}"')
    lesson_type = lesson.get("type")
    if not lesson_type:
        errors.append('Falta el campo "type"')
    elif lesson_type not in VALID_LESSON_TYPES:
        errors.append(
            f'"type" debe ser uno de {sorted(VALID_LESSON_TYPES)}, no "{lesson_type}"'
        )

    errors += _validate_vocabulary(lesson.get("vocabulary"))
    errors += _validate_sections(lesson.get("sections"))
    errors += _validate_exercises(lesson.get("exercises"))

    return _result(not errors, errors, lesson)


def _validate_vocabulary(vocabulary) -> list[str]:
    errors = []
    if vocabulary is None:
        return errors
    if not isinstance(vocabulary, list):
        return ['"vocabulary" debe ser una lista']
    for i, item in enumerate(vocabulary):
        if not isinstance(item, dict):
            errors.append(f'vocabulary[{i}]: debe ser un mapping')
            continue
        if not item.get("word"):
            errors.append(f'vocabulary[{i}]: falta "word"')
        if not item.get("translation"):
            errors.append(f'vocabulary[{i}]: falta "translation"')
    return errors


def _validate_sections(sections) -> list[str]:
    errors = []
    if sections is None:
        return errors
    if not isinstance(sections, list):
        return ['"sections" debe ser una lista']
    for i, section in enumerate(sections):
        if not isinstance(section, dict):
            errors.append(f'sections[{i}]: debe ser un mapping')
            continue
        if not section.get("title"):
            errors.append(f'sections[{i}]: falta "title"')
        if not section.get("content"):
            errors.append(f'sections[{i}]: falta "content"')
    return errors


def _validate_exercises(exercises) -> list[str]:
    errors = []
    if exercises is None:
        return errors
    if not isinstance(exercises, list):
        return ['"exercises" debe ser una lista']
    for i, ex in enumerate(exercises):
        if not isinstance(ex, dict):
            errors.append(f'exercises[{i}]: debe ser un mapping')
            continue
        ex_type = ex.get("type")
        if ex_type not in VALID_EXERCISE_TYPES:
            errors.append(
                f'exercises[{i}]: "type" debe ser uno de {sorted(VALID_EXERCISE_TYPES)}'
            )
        if not ex.get("prompt"):
            errors.append(f'exercises[{i}]: falta "prompt"')
        if not ex.get("answer"):
            errors.append(f'exercises[{i}]: falta "answer"')
        if ex_type == "multiple_choice":
            options = ex.get("options")
            if not isinstance(options, list) or not options:
                errors.append(f'exercises[{i}]: multiple_choice requiere "options"')
            elif ex.get("answer") not in options:
                errors.append(f'exercises[{i}]: "answer" debe estar en "options"')
    return errors


def _result(valid: bool, errors: list[str], lesson) -> dict:
    stats = None
    if lesson is not None:
        stats = {
            "vocabulary": len(lesson.get("vocabulary") or []),
            "sections": len(lesson.get("sections") or []),
            "exercises": len(lesson.get("exercises") or []),
        }
    return {"valid": valid, "errors": errors, "lesson": lesson, "stats": stats}
