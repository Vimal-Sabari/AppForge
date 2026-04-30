import { Request, Response, NextFunction } from 'express'
import {
  GenerateRequestSchema,
  ModifyRequestSchema,
  SuggestFieldsRequestSchema,
} from './ai.schemas'
import { generateConfig, modifyConfig, suggestFields } from './ai.service'

/** Sends one server-sent event payload. */
function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/** Streams AppConfig generation progress and result over SSE. */
export async function generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = GenerateRequestSchema.parse(req.body)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    sendEvent(res, 'status', { message: 'Generating config...' })
    const result = await generateConfig(body.prompt, (token) => {
      sendEvent(res, 'token', { token })
    })
    sendEvent(res, 'config', result)
    sendEvent(res, 'done', { ok: true })
    res.end()
  } catch (error) {
    next(error)
  }
}

/** Modifies an existing config from conversational input. */
export async function modify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = ModifyRequestSchema.parse(req.body)
    const result = await modifyConfig(body.prompt, body.config)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/** Suggests fields for a table name. */
export function suggest(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = SuggestFieldsRequestSchema.parse(req.body)
    res.json({ fields: suggestFields(body.tableName) })
  } catch (error) {
    next(error)
  }
}
