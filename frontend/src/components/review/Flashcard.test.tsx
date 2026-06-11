import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Flashcard } from './Flashcard'
import type { VocabWord } from '@/types/database'

const WORD: VocabWord = {
  id: 'w1',
  user_id: 'demo-user',
  language: 'en',
  word: 'accomplish',
  translation: 'lograr',
  ipa: '/əˈkʌmplɪʃ/',
  definition: 'To finish successfully',
  example_sentence: 'She accomplished her goal.',
  status: 'learning',
  times_seen: 2,
  times_correct: 1,
  tags: ['verbo'],
  created_at: '2026-06-01T00:00:00Z',
  last_reviewed_at: null,
  interval_days: 1,
  ease: 2.5,
  due_at: '2026-06-09T00:00:00Z',
}

describe('Flashcard', () => {
  it('muestra solo el frente al inicio (sin traducción)', () => {
    render(<Flashcard word={WORD} onRate={vi.fn()} />)
    expect(screen.getByText('accomplish')).toBeInTheDocument()
    expect(screen.queryByText('lograr')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mostrar/i })).toBeInTheDocument()
  })

  it('al revelar muestra traducción, definición y botones de calificación', async () => {
    const user = userEvent.setup()
    render(<Flashcard word={WORD} onRate={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /mostrar/i }))

    expect(screen.getByText('lograr')).toBeInTheDocument()
    expect(screen.getByText('To finish successfully')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /otra vez/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /difícil/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^bien$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fácil/i })).toBeInTheDocument()
  })

  it('reporta la calificación elegida', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<Flashcard word={WORD} onRate={onRate} />)

    await user.click(screen.getByRole('button', { name: /mostrar/i }))
    await user.click(screen.getByRole('button', { name: /^bien$/i }))

    expect(onRate).toHaveBeenCalledWith('good')
  })

  it('vuelve a ocultar el reverso cuando cambia la palabra', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Flashcard word={WORD} onRate={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /mostrar/i }))

    rerender(<Flashcard word={{ ...WORD, id: 'w2', word: 'endeavor', translation: 'esfuerzo' }} onRate={vi.fn()} />)

    expect(screen.queryByText('esfuerzo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mostrar/i })).toBeInTheDocument()
  })
})
