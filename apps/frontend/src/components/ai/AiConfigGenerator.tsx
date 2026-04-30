'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store/auth.store'
import { Bot, Send, Wand2 } from 'lucide-react'

interface AiConfigGeneratorProps {
  onConfig: (json: string) => void
}

interface StreamConfigEvent {
  config?: unknown
  warnings?: string[]
  source?: string
}

/** Reads SSE chunks from a fetch response and returns config events. */
async function readSse(
  response: Response,
  onEvent: (event: string, data: StreamConfigEvent) => void
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Streaming is not available')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  let doneReading = false
  while (!doneReading) {
    const { done, value } = await reader.read()
    if (done) {
      doneReading = true
      continue
    }
    buffer += decoder.decode(value, { stream: true })

    const packets = buffer.split('\n\n')
    buffer = packets.pop() || ''

    for (const packet of packets) {
      const event = packet.match(/^event: (.+)$/m)?.[1]
      const data = packet.match(/^data: (.+)$/m)?.[1]
      if (event && data) {
        onEvent(event, JSON.parse(data) as StreamConfigEvent)
      }
    }
  }
}

/** Chat-style generator for natural-language AppConfig creation. */
export function AiConfigGenerator({ onConfig }: AiConfigGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState('Describe the app you want to build.')
  const [isGenerating, setIsGenerating] = useState(false)
  const { accessToken } = useAuthStore()

  const generate = async (): Promise<void> => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setStatus('Starting generation...')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('AI generation failed')
      }

      let accumulatedTokens = ''
      await readSse(response, (event, data) => {
        if (event === 'status') {
          setStatus(String((data as { message?: string }).message || 'Generating...'))
        }
        if (event === 'token') {
          accumulatedTokens += (data as { token: string }).token
          // Optional: update a local "streaming preview" state
          setStatus(`Generating: ${accumulatedTokens.slice(-50)}...`)
        }
        if (event === 'config' && data.config) {
          onConfig(JSON.stringify(data.config, null, 2))
          setStatus(`Generated config (${data.source || 'ai'}).`)
        }
        if (event === 'done') {
          setStatus('Config ready. Review and validate it when you are happy.')
        }
      })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="border-b border-gray-200 bg-blue-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900">
        <Bot className="h-4 w-4" />
        AI Generator
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Example: Build a customer support tracker with tickets, priorities, assignees, CSV import, and email notifications."
          className="min-h-[88px] flex-1 resize-none rounded-md border border-blue-200 bg-white p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={generate}
          disabled={isGenerating || !prompt.trim()}
          className="inline-flex min-w-36 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isGenerating ? (
            <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Generate
        </button>
      </div>
      <p className="mt-2 text-xs text-blue-800">{status}</p>
    </div>
  )
}
