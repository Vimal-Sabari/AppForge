import { AppConfig } from 'shared-types'
import { env } from '../../config/env'
import { ConfigValidator } from '../../core/ConfigValidator'

interface AiResult {
  config: AppConfig
  warnings: string[]
  source: 'llm' | 'fallback'
}

const FIELD_TYPES = ['text', 'number', 'boolean', 'date', 'email', 'select', 'textarea'] as const

/** Extracts the first JSON object from model text. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in AI output')
  }
  return JSON.parse(text.slice(start, end + 1))
}

/** Builds deterministic fields from table-name context. */
export function suggestFields(
  tableName: string
): { name: string; type: (typeof FIELD_TYPES)[number]; required?: boolean }[] {
  const lower = tableName.toLowerCase()
  if (lower.includes('user') || lower.includes('customer')) {
    return [
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'phone', type: 'text' },
      { name: 'active', type: 'boolean' },
    ]
  }
  if (lower.includes('task') || lower.includes('todo')) {
    return [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
      { name: 'status', type: 'select' },
      { name: 'dueDate', type: 'date' },
    ]
  }
  return [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'createdOn', type: 'date' },
  ]
}

/** Creates a valid fallback config when no LLM key is configured. */
function fallbackConfig(prompt: string): AppConfig {
  const words = prompt.toLowerCase()
  const tableName = words.includes('task')
    ? 'tasks'
    : words.includes('customer')
      ? 'customers'
      : 'items'
  const fields = suggestFields(tableName).map((field) =>
    field.name === 'status' ? { ...field, options: ['New', 'In Progress', 'Done'] } : field
  )

  return {
    version: '1.0',
    name: prompt.trim().slice(0, 60) || 'Generated App',
    auth: { enabled: true, methods: ['email', 'google'], userScoped: true },
    database: { tables: [{ name: tableName, displayName: tableName, fields }] },
    ui: {
      theme: 'light',
      language: 'en',
      pages: [
        {
          id: 'home',
          path: 'home',
          title: 'Home',
          components: [
            {
              id: 'table',
              type: 'table',
              tableRef: tableName,
              actions: ['create', 'read', 'update', 'delete'],
            },
          ],
        },
      ],
    },
  }
}

/** Calls OpenAI chat completions and returns model text. */
async function callOpenAi(prompt: string, onToken?: (token: string) => void): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      stream: !!onToken,
      messages: [
        {
          role: 'system',
          content:
            'Return only valid AppForge AppConfig JSON. Supported field types: text, number, boolean, date, email, select, textarea, file. Supported component types: form, table, dashboard, chart, text.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`)
  }

  if (onToken && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6))
            const content = data.choices[0]?.delta?.content || ''
            if (content) {
              fullText += content
              onToken(content)
            }
          } catch (e) {
            // ignore partial json
          }
        }
      }
    }
    return fullText
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return payload.choices?.[0]?.message?.content ?? ''
}

/** Calls Google Gemini and returns model text. */
async function callGemini(prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Return only valid AppForge AppConfig JSON. Supported field types: text, number, boolean, date, email, select, textarea, file. Supported component types: form, table, dashboard, chart, text. Prompt: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`)
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

/** Generates and validates an AppConfig from natural language, optionally streaming tokens. */
export async function generateConfig(
  prompt: string,
  onToken?: (token: string) => void
): Promise<AiResult> {
  try {
    let modelText: string
    if (env.GEMINI_API_KEY) {
      // Gemini streaming is slightly different, fallback to OpenAI if possible or just use non-stream for Gemini for now
      // but let's implement OpenAI stream as it's the primary requirement.
      modelText = await callGemini(prompt)
    } else if (env.OPENAI_API_KEY) {
      modelText = await callOpenAi(prompt, onToken)
    } else {
      console.warn('[AI] No LLM API keys found. Using fallback deterministic generator.')
      throw new Error('Missing API Key')
    }

    const raw = extractJson(modelText)
    const validated = ConfigValidator.validateConfig(raw)
    if (validated.valid) {
      return { config: validated.config, warnings: validated.warnings, source: 'llm' }
    }

    // Repair logic
    const repairPrompt = `Repair this invalid AppForge config so it validates. Warnings: ${validated.warnings.join('; ')} JSON: ${JSON.stringify(raw)}`
    const repairText = env.GEMINI_API_KEY
      ? await callGemini(repairPrompt)
      : await callOpenAi(repairPrompt)
    const repaired = ConfigValidator.validateConfig(extractJson(repairText))
    if (repaired.valid) {
      return { config: repaired.config, warnings: repaired.warnings, source: 'llm' }
    }
  } catch (error) {
    console.error('[AI] LLM Error:', error)
  }

  return {
    config: fallbackConfig(prompt),
    warnings: ['Used fallback generator'],
    source: 'fallback',
  }
}

/** Applies a natural-language modification to an existing config. */
export async function modifyConfig(
  prompt: string,
  config: Record<string, unknown>
): Promise<AiResult> {
  return generateConfig(
    `Modify this AppForge config according to: ${prompt}\nCurrent config: ${JSON.stringify(config)}`
  )
}
