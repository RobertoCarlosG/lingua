import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


DICTIONARY_RESPONSE = [
    {
        "word": "accomplish",
        "phonetic": "/əˈkʌmplɪʃ/",
        "phonetics": [
            {"text": "/əˈkʌmplɪʃ/", "audio": "https://example.com/accomplish.mp3"},
        ],
        "meanings": [
            {
                "partOfSpeech": "verb",
                "definitions": [
                    {
                        "definition": "To finish successfully.",
                        "example": "She accomplished her goal.",
                    }
                ],
                "synonyms": ["achieve", "complete", "do", "finish", "fulfill", "extra"],
            }
        ],
    }
]

TRANSLATION_RESPONSE = {"responseData": {"translatedText": "Lograr"}}
