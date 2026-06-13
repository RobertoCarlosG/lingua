import { describe, it, expect } from 'vitest'
import { buildLessonGptPrompt, LESSON_TEMPLATE_YML } from './lesson-import'
import { parseLesson, validateLesson } from './yaml-parser'

describe('lesson-import', () => {
  it('LESSON_TEMPLATE_YML parses and validates', () => {
    const parsed = parseLesson(LESSON_TEMPLATE_YML)
    expect(parsed).not.toBeNull()
    expect(validateLesson(parsed!)).toEqual([])
  })

  it('buildLessonGptPrompt includes language code and template', () => {
    const prompt = buildLessonGptPrompt('en')
    expect(prompt).toContain('language: en')
    expect(prompt).toContain('Para esta lección usa: en')
    expect(prompt).toContain('type: vocabulary')
    expect(prompt).toContain(LESSON_TEMPLATE_YML)
  })

  it('buildLessonGptPrompt adapts to each supported language', () => {
    expect(buildLessonGptPrompt('pt')).toContain('Para esta lección usa: pt')
    expect(buildLessonGptPrompt('ja')).toContain('Para esta lección usa: ja')
    expect(buildLessonGptPrompt('ja')).toContain('日本語')
  })
})
