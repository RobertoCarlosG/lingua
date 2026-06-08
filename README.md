# Lingua — App de aprendizaje EN & PT

Stack: React + Vite + TypeScript + Tailwind (Vercel) · Express (Render) · Supabase

## Estructura

```
lingua/
├── frontend/          # React app → Vercel
│   └── src/
│       ├── pages/     # Dashboard, Vocabulary, ErrorBank, Lessons, Chat
│       ├── components/
│       ├── lib/       # supabase.ts, store.ts, yaml-parser.ts, utils.ts
│       └── types/     # database.ts (tipos TypeScript)
├── backend/           # Express API → Render
│   └── src/index.js   # Proxy Anthropic + endpoints
├── supabase/
│   └── migrations/    # SQL para crear las tablas
├── vercel.json
├── render.yaml
└── .env.example
```

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
2. Conecta tu repositorio → `root directory: backend`
3. Build: `npm install` · Start: `npm start`
4. Agrega las variables de entorno:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
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

# Instala todo
npm install

# Levanta ambos servidores
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## Secciones de la app

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | Progreso semanal, stats, plan del día |
| **Vocabulario** | Glosario con estados (new/learning/known/mastered) |
| **Banco de errores** | Registro de errores con detección de recurrentes |
| **Lecciones** | Editor YAML → renderizado interactivo con ejercicios |
| **Práctica IA** | Chat con Claude como tutor, comandos `[vocabulario]` etc. |

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
