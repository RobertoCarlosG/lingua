import respx
import yaml
from httpx import Response

from tests.conftest import DICTIONARY_RESPONSE, TRANSLATION_RESPONSE

DICT_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"
TRANSLATE_URL = "https://api.mymemory.translated.net/get"


@respx.mock
def test_generate_lesson_returns_valid_yaml(client):
    respx.get(f"{DICT_BASE}/accomplish").mock(
        return_value=Response(200, json=DICTIONARY_RESPONSE)
    )
    respx.get(TRANSLATE_URL).mock(return_value=Response(200, json=TRANSLATION_RESPONSE))

    resp = client.get(
        "/api/lessons/generate",
        params={"words": "accomplish", "title": "Mi lección", "level": "B2"},
    )

    assert resp.status_code == 200
    lesson = yaml.safe_load(resp.text)
    assert lesson["title"] == "Mi lección"
    assert lesson["language"] == "en"
    assert lesson["level"] == "B2"
    assert lesson["type"] == "vocabulary"
    assert len(lesson["vocabulary"]) == 1
    entry = lesson["vocabulary"][0]
    assert entry["word"] == "accomplish"
    assert entry["ipa"] == "/əˈkʌmplɪʃ/"
    assert entry["translation"] == "lograr"
    assert "verb" in entry["tags"]
    assert "B2" in entry["tags"]


@respx.mock
def test_generate_lesson_reports_words_not_found(client):
    respx.get(f"{DICT_BASE}/accomplish").mock(
        return_value=Response(200, json=DICTIONARY_RESPONSE)
    )
    respx.get(f"{DICT_BASE}/zzzzz").mock(return_value=Response(404))
    respx.get(TRANSLATE_URL).mock(return_value=Response(200, json=TRANSLATION_RESPONSE))

    resp = client.get("/api/lessons/generate", params={"words": "accomplish, zzzzz"})

    assert resp.status_code == 200
    lesson = yaml.safe_load(resp.text)
    assert len(lesson["vocabulary"]) == 1
    assert "zzzzz" in lesson["notes"]


def test_generate_lesson_empty_words_returns_400(client):
    resp = client.get("/api/lessons/generate", params={"words": " , , "})
    assert resp.status_code == 400


def test_generate_lesson_too_many_words_returns_400(client):
    words = ",".join(f"word{i}" for i in range(16))
    resp = client.get("/api/lessons/generate", params={"words": words})
    assert resp.status_code == 400


@respx.mock
def test_generate_lesson_all_words_missing_returns_404(client):
    respx.get(f"{DICT_BASE}/zzzzz").mock(return_value=Response(404))
    resp = client.get("/api/lessons/generate", params={"words": "zzzzz"})
    assert resp.status_code == 404
