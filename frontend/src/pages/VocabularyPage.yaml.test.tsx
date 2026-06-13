import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VocabularyPage } from './VocabularyPage'
import { renderWithProviders } from '@/test/render-with-providers'
import { VOCAB_LIST_TEMPLATE_YML } from '@/lib/vocab-yaml'

const { fromMock, insertMock, orderMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  orderMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: {},
    loading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}))

function mockSupabase(existingWords: string[] = []) {
  orderMock.mockResolvedValue({ data: [], error: null })
  insertMock.mockResolvedValue({ error: null })

  fromMock.mockImplementation((table: string) => {
    if (table !== 'vocab_words') throw new Error(`unexpected table ${table}`)

    return {
      select: vi.fn((cols: string) => {
        if (cols === '*') {
          return { eq: vi.fn().mockReturnValue({ order: orderMock }) }
        }
        return {
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: existingWords.map(word => ({ word })),
              error: null,
            }),
          }),
        }
      }),
      insert: insertMock,
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase()
})

describe('VocabularyPage YAML import (integración UI)', () => {
  it('importa palabras desde archivo YAML y muestra confirmación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VocabularyPage />)

    await waitFor(() => {
      expect(screen.getByText(/vocabulario/i)).toBeInTheDocument()
    })

    const file = new File([VOCAB_LIST_TEMPLATE_YML], 'vocab.yml', { type: 'text/yaml' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled()
      expect(screen.getByText(/importados/i)).toBeInTheDocument()
    })
  })

  it('muestra error si el idioma del YAML no coincide', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VocabularyPage />, { activeLanguage: 'pt' })

    await waitFor(() => {
      expect(screen.getByText(/vocabulario/i)).toBeInTheDocument()
    })

    const file = new File([VOCAB_LIST_TEMPLATE_YML], 'vocab.yml', { type: 'text/yaml' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/inglés|English/i)).toBeInTheDocument()
      expect(insertMock).not.toHaveBeenCalled()
    })
  })
})
