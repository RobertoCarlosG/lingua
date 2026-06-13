import { LANGUAGE_CODES, languageConfig, type Language } from '@/lib/languages'

/** Plantilla completa compatible con el validador de Lingua (todos los tipos de ejercicio). */
export const LESSON_TEMPLATE_YML = `title: "Nombre de la lección — Tema"
language: en
level: B1
type: vocabulary
objectives:
  - Aprender vocabulario clave del tema
  - Usar las palabras nuevas en contexto natural
  - Practicar con ejercicios variados

vocabulary:
  - word: "example"
    ipa: "/ɪɡˈzæmpəl/"
    translation: "ejemplo"
    definition: "A thing characteristic of its kind or illustrating a general rule"
    example: "This is a good example of British usage."
    tags: ["sustantivo", "B1"]

  - word: "achieve"
    ipa: "/əˈtʃiːv/"
    translation: "lograr, alcanzar"
    definition: "To successfully bring about or reach a desired objective"
    example: "She achieved her goal after months of practice."
    tags: ["verbo", "B1"]

sections:
  - title: "Explicación del tema"
    type: explanation
    content: |
      Texto explicativo en español (idioma del estudiante).
      Usa varias líneas con el bloque literal (|).
      Puedes incluir listas numeradas y contexto cultural.
    tips:
      - Consejo práctico para el estudiante
      - Diferencia importante con el español

  - title: "Diálogo de ejemplo"
    type: dialogue
    content: |
      A: Could you give me an example?
      B: Sure — this sentence is a good one.

exercises:
  - type: translate
    prompt: "Traduce al inglés: 'Este es un buen ejemplo'"
    answer: "This is a good example"
    explanation: "Orden natural: demostrativo + verbo + artículo + adjetivo + sustantivo"

  - type: fill_blank
    prompt: "She ___ her goal after months of practice."
    answer: "achieved"
    explanation: "Pasado simple de 'achieve'"

  - type: multiple_choice
    prompt: "¿Cuál es la traducción más precisa de 'example'?"
    options: ["example", "sample", "instance", "model"]
    answer: "example"
    explanation: "'Example' es la traducción directa en este contexto"

  - type: reorder
    prompt: "Ordena: 'good / a / is / This / example'"
    answer: "This is a good example"
    explanation: "Sujeto + verbo + complemento"

notes: "Nota opcional al pie de la lección."
`

export function downloadLessonTemplate(): void {
  const blob = new Blob([LESSON_TEMPLATE_YML], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'lingua-leccion-plantilla.yml'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildLessonGptPrompt(language: Language): string {
  const { label, levels } = languageConfig(language)
  const codes = LANGUAGE_CODES.join(' | ')

  return `Eres un experto en diseño de materiales para aprender idiomas. Genera una lección completa en formato YAML compatible con la app Lingua.

## Tu tarea
Crea una lección sobre: [TEMA — describe el tema, p. ej. "verbos irregulares en pasado" o "saludos formales"]
- Idioma objetivo: ${label} (niveles habituales en Lingua: ${levels})
- Nivel: [NIVEL — p. ej. A1, B2, N4]
- Tipo de lección: [TIPO — vocabulary | phonetics | grammar | reading | conversation]

## Reglas estrictas
1. Responde ÚNICAMENTE con YAML válido. Sin markdown, sin \`\`\`yaml, sin explicaciones antes ni después.
2. El campo \`language\` debe ser exactamente uno de: ${codes}
   Para esta lección usa: ${language}
3. El campo \`type\` debe ser uno de: vocabulary | phonetics | grammar | reading | conversation
4. Campos obligatorios: title, language, level, type
5. \`objectives\`: 2–4 objetivos en español, concretos y medibles
6. \`vocabulary\`: 6–12 ítems; cada uno con word, ipa, translation, definition, example (tags opcional)
7. \`sections\`: al menos 1 sección con title, type (explanation | reading | dialogue | phonetics), content (texto multilínea con |); tips opcional
8. \`exercises\`: mínimo 4, mezclando tipos:
   - translate — traducción libre
   - fill_blank — completar hueco
   - multiple_choice — incluye \`options\` (array) y \`answer\` debe estar en options
   - reorder — ordenar palabras sueltas
   Cada ejercicio: prompt, answer; explanation recomendado
9. \`notes\`: opcional, nota breve al pie
10. objectives, tips, prompts y explanations → en español (idioma del estudiante)
11. word, definition, example → en ${label} (idioma objetivo)
12. Usa comillas dobles en strings con dos puntos, comas o caracteres especiales
13. Respeta la indentación YAML (2 espacios); no uses tabuladores

## Plantilla de referencia (estructura exacta)
${LESSON_TEMPLATE_YML}

Genera la lección ahora.`
}
