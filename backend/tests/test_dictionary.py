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


# ── Ruta multiidioma /api/dictionary/{lang}/{word} ──────────────────────────


@respx.mock
def test_multilang_english_full_entry(client):
    respx.get(DICT_URL).mock(return_value=Response(200, json=DICTIONARY_RESPONSE))
    respx.get(TRANSLATE_URL).mock(return_value=Response(200, json=TRANSLATION_RESPONSE))

    resp = client.get("/api/dictionary/en/accomplish")

    assert resp.status_code == 200
    body = resp.json()
    assert body["word"] == "accomplish"
    assert body["ipa"] == "/əˈkʌmplɪʃ/"
    assert body["translation_suggestion"] == "lograr"


@respx.mock
def test_multilang_portuguese_degrades_to_translation_only(client):
    # La Free Dictionary API no cubre pt → 404; MyMemory sí traduce pt|es
    respx.get("https://api.dictionaryapi.dev/api/v2/entries/pt/saudade").mock(
        return_value=Response(404, json={"title": "No Definitions Found"})
    )
    respx.get(TRANSLATE_URL).mock(
        return_value=Response(200, json={"responseData": {"translatedText": "Añoranza"}})
    )

    resp = client.get("/api/dictionary/pt/saudade")

    assert resp.status_code == 200
    body = resp.json()
    assert body["word"] == "saudade"
    assert body["ipa"] is None
    assert body["audio"] is None
    assert body["meanings"] == []
    assert body["translation_suggestion"] == "añoranza"


@respx.mock
def test_multilang_translation_uses_source_langpair(client):
    respx.get("https://api.dictionaryapi.dev/api/v2/entries/pt/saudade").mock(
        return_value=Response(404, json={})
    )
    route = respx.get(TRANSLATE_URL, params={"langpair": "pt|es"}).mock(
        return_value=Response(200, json={"responseData": {"translatedText": "Añoranza"}})
    )

    resp = client.get("/api/dictionary/pt/saudade")

    assert resp.status_code == 200
    assert route.called


def test_multilang_unsupported_language_returns_400(client):
    resp = client.get("/api/dictionary/xx/word")

    assert resp.status_code == 400
    assert "xx" in resp.json()["detail"]


@respx.mock
def test_multilang_nothing_found_returns_404(client):
    respx.get("https://api.dictionaryapi.dev/api/v2/entries/pt/zzzzz").mock(
        return_value=Response(404, json={})
    )
    respx.get(TRANSLATE_URL).mock(return_value=Response(500))

    resp = client.get("/api/dictionary/pt/zzzzz")

    assert resp.status_code == 404
