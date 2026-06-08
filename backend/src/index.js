import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true }))

app.post('/api/chat', async (req, res) => {
  const { messages, system, language } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages required' })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: system || buildSystemPrompt(language || 'en'),
      messages,
    })

    res.json({ content: response.content[0].text })
  } catch (err) {
    console.error('Anthropic error:', err)
    res.status(500).json({ error: 'AI request failed' })
  }
})

function buildSystemPrompt(language) {
  return `Eres un tutor de idiomas para Roberto, hablante nativo de español (mexicano).
IDIOMA ACTIVO: ${language === 'en' ? 'Inglés' : 'Portugués'}
Inglés: A2-B1, meta C1. Portugués: A1, meta B2.
Corrige errores siempre, incluye IPA, exige nivel B1+.`
}

app.listen(PORT, () => {
  console.log(`Lingua backend running on :${PORT}`)
})
