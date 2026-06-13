import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { useStore } from '@/lib/store'

interface Options extends RenderOptions {
  route?: string
  activeLanguage?: 'en' | 'pt' | 'ja'
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', activeLanguage = 'en', ...renderOptions } = options

  useStore.setState({ activeLanguage })

  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
