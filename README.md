# Lingua — App de aprendizaje EN & PT

Stack: React + Vite + TypeScript + Tailwind (Vercel) · FastAPI/Python (Render) · Supabase

> El chat con IA está deshabilitado en este MVP. El código de `ChatPage.tsx` se conserva para reactivarlo después.

## Estructura

```
lingua/
├── frontend/          # React app → Vercel (yarn workspace)
│   └── src/
│       ├── pages/     # Dashboard, Vocabulary, ErrorBank, Lessons
│       ├── components/
│       ├── lib/       # supabase.ts, store.ts, yaml-parser.ts, dictionary.ts
│       └── types/     # database.ts (tipos TypeScript)
├── backend/           # FastAPI → Render
│   ├── app/main.py    # /health, /api/dictionary, /api/lessons/generate
│   └── requirements.txt
├── supabase/
│   └── migrations/    # SQL para crear las tablas
├── vercel.json
├── render.yaml
└── .env.example
```

## API de diccionario

El backend consulta APIs públicas (sin API key):

- [Free Dictionary API](https://dictionaryapi.dev) — IPA, definiciones, ejemplos, audio (solo inglés)
- [MyMemory](https://mymemory.translated.net/doc/spec.php) — sugerencia de traducción EN→ES

Endpoints:

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/dictionary/{word}` | Busca una palabra: IPA, definiciones, audio, traducción sugerida |
| `GET /api/lessons/generate?words=a,b,c&title=...&level=B1` | Genera el YAML de una lección de vocabulario |

En la UI: botón de diccionario en "Agregar palabra" (autocompleta IPA/definición/ejemplo/traducción) y "Generar YAML" en el editor de lecciones.

## Setup paso a paso

### 1. Supabase

1. Ve a tu proyecto en supabase.com → SQL Editor
2. Pega y ejecuta el contenido de `supabase/migrations/001_initial.sql`
3. Ve a Settings → API y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY` (solo backend)

### 2. Backend en Render

1. Crea un nuevo **Web Service** en render.com
2. Conecta tu repositorio → `root directory: backend` · Runtime: **Python**
3. Build: `pip install -r requirements.txt` · Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Agrega las variables de entorno:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   FRONTEND_URL=https://tu-app.vercel.app
   ```
5. Copia la URL del servicio: `https://lingua-backend.onrender.com`

### 3. Frontend en Vercel

1. Importa el repo en vercel.com
2. Framework preset: **Vite**
3. Root directory: `frontend`
4. Agrega las variables de entorno:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_URL=https://lingua-backend.onrender.com
   ```
5. Deploy

### 4. Dev local

```bash
cp .env.example frontend/.env.local
cp .env.example backend/.env

# Frontend (yarn workspaces)
yarn install

# Backend (Python)
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && cd ..

# Levanta ambos servidores
yarn dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## Secciones de la app

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | Racha, actividad semanal y meta de días activos calculadas de `session_logs` (datos reales) |
| **Repaso** | Flashcards con repetición espaciada (SM-2): otra vez / difícil / bien / fácil. Registra cada sesión |
| **Vocabulario** | Glosario con estados; el estado se promueve solo según el intervalo SRS. Botón de diccionario que autocompleta |
| **Banco de errores** | Registro de errores con detección de recurrentes |
| **Lecciones** | Editor YAML → renderizado interactivo. Subir archivo `.yml`, generar desde palabras, y agregar el vocabulario al glosario con un clic |
| ~~Práctica IA~~ | Deshabilitada en este MVP |

## Tests (TDD)

```bash
# Frontend (vitest) — 51 tests
cd frontend && yarn vitest run

# Backend (pytest) — 18 tests
cd backend && .venv/bin/pytest
```

El flujo de aprendizaje cierra el ciclo: subes o generas una lección YAML → su vocabulario
entra al glosario con SRS inicial → la página **Repaso** te muestra las palabras vencidas
cada día → cada repaso reprograma la palabra (SM-2) y alimenta el dashboard.

## Sistema de lecciones YAML

Las lecciones se escriben en YAML y se renderizan automáticamente. Estructura:

```yaml
title: "Nombre de la lección"
language: en          # en | pt
level: B1
type: vocabulary      # vocabulary | phonetics | grammar | reading | conversation
objectives:
  - Objetivo 1

vocabulary:
  - word: "example"
    ipa: "/ɪɡˈzæmpəl/"
    translation: "ejemplo"
    definition: "A thing characteristic of its kind"
    example: "This is a good example."
    tags: ["sustantivo", "C1"]

sections:
  - title: "Explicación"
    type: explanation
    content: |
      Texto explicativo aquí.
    tips:
      - Consejo útil

exercises:
  - type: translate       # translate | fill_blank | multiple_choice
    prompt: "Traduce: 'ejemplo'"
    answer: "example"
    explanation: "Cognado parcial del latín"

notes: "Nota al pie opcional"
```
