import respx
from httpx import Response

from tests.conftest import DICTIONARY_RESPONSE, TRANSLATION_RESPONSE

DICT_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/accomplish"
TRANSLATE_URL = "https://api.mymemory.translated.net/get"


@respx.mock
def test_lookup_word_success(client):
    respx.get(DICT_URL).mock(return_value=Response(200, json=DICTIONARY_RESPONSE))
    respx.get(TRANSLATE_URL).mock(return_value=Response(200, json=TRANSLATION_RESPONSE))

    resp = client.get("/api/dictionary/accomplish")

    assert resp.status_code == 200
    body = resp.json()
    assert body["word"] == "accomplish"
    assert body["ipa"] == "/əˈkʌmplɪʃ/"
    assert body["audio"] == "https://example.com/accomplish.mp3"
    assert body["translation_suggestion"] == "lograr"
    assert len(body["meanings"]) == 1
    meaning = body["meanings"][0]
    assert meaning["part_of_speech"] == "verb"
    assert meaning["definition"] == "To finish successfully."
    assert meaning["example"] == "She accomplished her goal."
    assert len(meaning["synonyms"]) == 5  # se recortan a 5


@respx.mock
def test_lookup_word_normalizes_case_and_spaces(client):
    route = respx.get(DICT_URL).mock(return_value=Response(200, json=DICTIONARY_RESPONSE))
    respx.get(TRANSLATE_URL).mock(return_value=Response(200, json=TRANSLATION_RESPONSE))

    resp = client.get("/api/dictionary/ Accomplish ")

    assert resp.status_code == 200
    assert route.called


@respx.mock
def test_lookup_word_not_found_returns_404(client):
    respx.get("https://api.dictionaryapi.dev/api/v2/entries/en/zzzzz").mock(
        return_value=Response(404, json={"title": "No Definitions Found"})
    )

    resp = client.get("/api/dictionary/zzzzz")

    assert resp.status_code == 404


@respx.mock
def test_lookup_word_survives_translation_failure(client):
    respx.get(DICT_URL).mock(return_value=Response(200, json=DICTIONARY_RESPONSE))
    respx.get(TRANSLATE_URL).mock(return_value=Response(500))

    resp = client.get("/api/dictionary/accomplish")

    assert resp.status_code == 200
    assert resp.json()["translation_suggestion"] is None
