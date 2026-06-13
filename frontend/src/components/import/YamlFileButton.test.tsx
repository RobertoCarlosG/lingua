import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YamlFileButton } from './YamlFileButton'

describe('YamlFileButton', () => {
  it('dispara onLoad con el contenido del archivo YAML', async () => {
    const user = userEvent.setup()
    const onLoad = vi.fn()
    render(<YamlFileButton label="Subir YAML" onLoad={onLoad} />)

    const file = new File(['language: en\nwords: []'], 'vocab.yml', { type: 'text/yaml' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(onLoad).toHaveBeenCalledWith('language: en\nwords: []', 'vocab.yml')
  })

  it('respeta disabled', () => {
    render(<YamlFileButton label="Subir YAML" onLoad={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'Subir YAML' })).toBeDisabled()
  })
})
