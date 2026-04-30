import { z } from 'zod'

export const GenerateRequestSchema = z.object({
  prompt: z.string().min(3).max(4000),
})

export const ModifyRequestSchema = z.object({
  prompt: z.string().min(3).max(4000),
  config: z.record(z.string(), z.unknown()),
})

export const SuggestFieldsRequestSchema = z.object({
  tableName: z.string().min(1).max(80),
})

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
export type ModifyRequest = z.infer<typeof ModifyRequestSchema>
export type SuggestFieldsRequest = z.infer<typeof SuggestFieldsRequestSchema>
