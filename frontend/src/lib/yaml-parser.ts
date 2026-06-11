import yaml from 'js-yaml'
import type { LessonYAML } from '@/types/database'

export function parseLesson(yamlString: string): LessonYAML | null {
  try {
    const parsed = yaml.load(yamlString) as LessonYAML
    if (!parsed?.title || !parsed?.language) return null
    return parsed
  } catch {
    return null
  }
}

const VALID_LANGUAGES = ['en', 'pt']
const VALID_LESSON_TYPES = ['vocabulary', 'phonetics', 'grammar', 'reading', 'conversation']
const VALID_EXERCISE_TYPES = ['fill_blank', 'translate', 'multiple_choice', 'reorder']

export function validateLesson(lesson: LessonYAML): string[] {
  const errors: string[] = []

  if (!lesson.title) errors.push('Falta el campo "title"')
  if (!lesson.language) errors.push('Falta el campo "language" (en | pt)')
  else if (!VALID_LANGUAGES.includes(lesson.language)) {
    errors.push(`"language" debe ser en | pt, no "${lesson.language}"`)
  }
  if (!lesson.type) errors.push('Falta el campo "type"')
  else if (!VALID_LESSON_TYPES.includes(lesson.type)) {
    errors.push(`"type" debe ser uno de: ${VALID_LESSON_TYPES.join(', ')}`)
  }

  lesson.vocabulary?.forEach((v, i) => {
    if (!v.word) errors.push(`vocabulary[${i}]: falta "word"`)
    if (!v.translation) errors.push(`vocabulary[${i}]: falta "translation"`)
  })

  lesson.sections?.forEach((s, i) => {
    if (!s.title) errors.push(`sections[${i}]: falta "title"`)
    if (!s.content) errors.push(`sections[${i}]: falta "content"`)
  })

  lesson.exercises?.forEach((ex, i) => {
    if (!VALID_EXERCISE_TYPES.includes(ex.type)) {
      errors.push(`exercises[${i}]: "type" debe ser uno de: ${VALID_EXERCISE_TYPES.join(', ')}`)
    }
    if (!ex.prompt) errors.push(`exercises[${i}]: falta "prompt"`)
    if (!ex.answer) errors.push(`exercises[${i}]: falta "answer"`)
    if (ex.type === 'multiple_choice') {
      if (!ex.options || ex.options.length === 0) {
        errors.push(`exercises[${i}]: multiple_choice requiere "options"`)
      } else if (!ex.options.includes(ex.answer)) {
        errors.push(`exercises[${i}]: "answer" debe estar en "options"`)
      }
    }
  })

  return errors
}

export const LESSON_TEMPLATE_VOCAB = `title: "10 palabras esenciales — Present Perfect"
language: en
level: B1
type: vocabulary
objectives:
  - Aprender 10 verbos comunes en pasado participio
  - Entender uso de have/has + participio

vocabulary:
  - word: "accomplish"
    ipa: "/əˈkʌmplɪʃ/"
    translation: "lograr, alcanzar"
    definition: "To succeed in doing something difficult"
    example: "She has accomplished all her goals this year."
    tags: ["verbo", "formal"]

  - word: "acknowledge"
    ipa: "/əkˈnɒlɪdʒ/"
    translation: "reconocer, admitir"
    definition: "To accept or admit the truth of something"
    example: "He has acknowledged his mistake."
    tags: ["verbo", "formal"]

notes: "Recuerda: el presente perfecto conecta pasado con presente."
`

export const LESSON_TEMPLATE_PHONETICS = `title: "Fonética — Vocales nasales del portugués"
language: pt
level: A1
type: phonetics

sections:
  - title: "La vocal nasal ão"
    type: phonetics
    content: |
      El sonido "ão" es una de las marcas más características del portugués brasileño.
      Se pronuncia como una vocal "a" nasalizada seguida de una semivocal "w" nasal.
      IPA: /ɐ̃w̃/
    tips:
      - "Imagina decir 'aun' pero cerrando la nariz"
      - "No existe en español — requiere práctica específica"
      - "Palabras clave: não, coração, mão, irmão"

vocabulary:
  - word: "não"
    ipa: "/nɐ̃w̃/"
    translation: "no"
    definition: "Negación en portugués"
    example: "Não entendo isso."
    
  - word: "coração"
    ipa: "/koɾaˈsɐ̃w̃/"
    translation: "corazón"
    definition: "Órgano del cuerpo / sentimiento"
    example: "Meu coração está feliz."

exercises:
  - type: translate
    prompt: "Traduce: 'Mi corazón no entiende'"
    answer: "Meu coração não entende"
    explanation: "Nota la posición del 'não' — igual que 'no' en español"
`
