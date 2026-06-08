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

export function validateLesson(lesson: LessonYAML): string[] {
  const errors: string[] = []
  if (!lesson.title) errors.push('Falta el campo "title"')
  if (!lesson.language) errors.push('Falta el campo "language" (en | pt)')
  if (!lesson.type) errors.push('Falta el campo "type"')
  if (lesson.vocabulary) {
    lesson.vocabulary.forEach((v, i) => {
      if (!v.word) errors.push(`Vocab[${i}]: falta "word"`)
      if (!v.ipa) errors.push(`Vocab[${i}]: falta "ipa"`)
      if (!v.translation) errors.push(`Vocab[${i}]: falta "translation"`)
    })
  }
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
