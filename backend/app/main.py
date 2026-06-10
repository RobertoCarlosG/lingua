import os

import httpx
import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

load_dotenv()

app = FastAPI(title="Lingua API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)

DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
TRANSLATE_API = "https://api.mymemory.translated.net/get"


async def fetch_dictionary_entry(client: httpx.AsyncClient, word: str) -> dict | None:
    """Consulta la Free Dictionary API y normaliza la respuesta."""
    resp = await client.get(DICTIONARY_API.format(word=word.strip().lower()))
    if resp.status_code != 200:
        return None
    entry = resp.json()[0]

    ipa = entry.get("phonetic") or next(
        (p["text"] for p in entry.get("phonetics", []) if p.get("text")), None
    )
    audio = next(
        (p["audio"] for p in entry.get("phonetics", []) if p.get("audio")), None
    )

    meanings = []
    for meaning in entry.get("meanings", []):
        definitions = meaning.get("definitions", [])
        if not definitions:
            continue
        first = definitions[0]
        meanings.append(
            {
                "part_of_speech": meaning.get("partOfSpeech"),
                "definition": first.get("definition"),
                "example": first.get("example"),
                "synonyms": meaning.get("synonyms", [])[:5],
            }
        )

    return {
        "word": entry.get("word", word),
        "ipa": ipa,
        "audio": audio,
        "meanings": meanings,
    }


async def fetch_translation(client: httpx.AsyncClient, word: str) -> str | None:
    """Sugiere una traducción EN→ES usando la API pública de MyMemory."""
    try:
        resp = await client.get(
            TRANSLATE_API, params={"q": word, "langpair": "en|es"}
        )
        if resp.status_code != 200:
            return None
        translated = resp.json().get("responseData", {}).get("translatedText")
        return translated.lower() if translated else None
    except httpx.HTTPError:
        return None


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/api/dictionary/{word}")
async def lookup_word(word: str):
    """Busca una palabra en inglés: IPA, definiciones, ejemplo, audio y
    una sugerencia de traducción al español."""
    async with httpx.AsyncClient(timeout=10) as client:
        entry = await fetch_dictionary_entry(client, word)
        if entry is None:
            raise HTTPException(status_code=404, detail=f"'{word}' no encontrada")
        entry["translation_suggestion"] = await fetch_translation(client, word)
    return entry


@app.get("/api/lessons/generate", response_class=PlainTextResponse)
async def generate_lesson_yaml(
    words: str = Query(..., description="Palabras separadas por coma"),
    title: str = Query("Vocabulario generado"),
    level: str = Query("B1"),
):
    """Genera el YAML de una lección de vocabulario a partir de una lista
    de palabras en inglés, usando el diccionario público."""
    word_list = [w.strip() for w in words.split(",") if w.strip()]
    if not word_list:
        raise HTTPException(status_code=400, detail="Lista de palabras vacía")
    if len(word_list) > 15:
        raise HTTPException(status_code=400, detail="Máximo 15 palabras por lección")

    vocabulary = []
    not_found = []
    async with httpx.AsyncClient(timeout=10) as client:
        for word in word_list:
            entry = await fetch_dictionary_entry(client, word)
            if entry is None:
                not_found.append(word)
                continue
            translation = await fetch_translation(client, word)
            first_meaning = entry["meanings"][0] if entry["meanings"] else {}
            vocabulary.append(
                {
                    "word": entry["word"],
                    "ipa": entry["ipa"] or "",
                    "translation": translation or "",
                    "definition": first_meaning.get("definition", ""),
                    "example": first_meaning.get("example") or "",
                    "tags": [t for t in [first_meaning.get("part_of_speech"), level] if t],
                }
            )

    if not vocabulary:
        raise HTTPException(status_code=404, detail="Ninguna palabra encontrada")

    lesson = {
        "title": title,
        "language": "en",
        "level": level,
        "type": "vocabulary",
        "objectives": [f"Aprender {len(vocabulary)} palabras nuevas"],
        "vocabulary": vocabulary,
    }
    if not_found:
        lesson["notes"] = f"No encontradas en el diccionario: {', '.join(not_found)}"

    return yaml.safe_dump(lesson, allow_unicode=True, sort_keys=False)
