VALID_LESSON = """
title: "Lección de prueba"
language: en
level: B1
type: vocabulary
objectives:
  - Aprender palabras
vocabulary:
  - word: "accomplish"
    ipa: "/əˈkʌmplɪʃ/"
    translation: "lograr"
    definition: "To finish successfully"
    example: "She accomplished her goal."
sections:
  - title: "Explicación"
    type: explanation
    content: "Texto explicativo"
exercises:
  - type: translate
    prompt: "Traduce: lograr"
    answer: "accomplish"
  - type: multiple_choice
    prompt: "¿Cuál es un sinónimo de accomplish?"
    answer: "achieve"
    options: ["achieve", "abandon", "avoid"]
"""


def test_validate_accepts_valid_lesson(client):
    resp = client.post("/api/lessons/validate", json={"yaml_content": VALID_LESSON})

    assert resp.status_code == 200
    body = resp.json()
    assert body["valid"] is True
    assert body["errors"] == []
    assert body["lesson"]["title"] == "Lección de prueba"
    assert body["stats"] == {"vocabulary": 1, "sections": 1, "exercises": 2}


def test_validate_rejects_broken_yaml(client):
    resp = client.post("/api/lessons/validate", json={"yaml_content": "title: [unclosed"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["valid"] is False
    assert body["lesson"] is None
    assert len(body["errors"]) >= 1


def test_validate_rejects_non_mapping_yaml(client):
    resp = client.post("/api/lessons/validate", json={"yaml_content": "- solo\n- una\n- lista"})

    body = resp.json()
    assert body["valid"] is False


def test_validate_reports_missing_required_fields(client):
    resp = client.post("/api/lessons/validate", json={"yaml_content": "level: B1"})

    body = resp.json()
    assert body["valid"] is False
    joined = " ".join(body["errors"])
    assert "title" in joined
    assert "language" in joined
    assert "type" in joined


def test_validate_rejects_unknown_language_and_type(client):
    lesson = 'title: "X"\nlanguage: zz\ntype: dancing'
    resp = client.post("/api/lessons/validate", json={"yaml_content": lesson})

    body = resp.json()
    assert body["valid"] is False
    joined = " ".join(body["errors"])
    assert "language" in joined
    assert "type" in joined


def test_validate_checks_vocabulary_entries(client):
    lesson = """
title: "X"
language: en
type: vocabulary
vocabulary:
  - ipa: "/x/"
  - word: "ok"
    translation: "bien"
"""
    resp = client.post("/api/lessons/validate", json={"yaml_content": lesson})

    body = resp.json()
    assert body["valid"] is False
    joined = " ".join(body["errors"])
    assert "vocabulary[0]" in joined and "word" in joined
    assert "vocabulary[1]" not in joined


def test_validate_checks_exercises(client):
    lesson = """
title: "X"
language: en
type: grammar
exercises:
  - type: fly
    prompt: "?"
    answer: "a"
  - type: multiple_choice
    prompt: "?"
    answer: "a"
    options: ["b", "c"]
  - type: translate
    answer: "a"
"""
    resp = client.post("/api/lessons/validate", json={"yaml_content": lesson})

    body = resp.json()
    assert body["valid"] is False
    joined = " ".join(body["errors"])
    assert "exercises[0]" in joined  # tipo inválido
    assert "exercises[1]" in joined  # answer fuera de options
    assert "exercises[2]" in joined  # falta prompt


def test_validate_requires_yaml_content_field(client):
    resp = client.post("/api/lessons/validate", json={})
    assert resp.status_code == 422
