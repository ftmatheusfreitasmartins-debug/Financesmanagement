import type { Handler, HandlerResponse } from '@netlify/functions'
import { neon } from '@netlify/neon'

type SavePayload = { state: unknown }

const MAX_BODY_CHARS = 5 * 1024 * 1024 // ~5MB (event.body é string)

const JSON_HEADERS: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
}

const TEXT_HEADERS: Record<string, string> = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
}

function safeParseJSON(input: string): any | null {
  if (!input || input.length > MAX_BODY_CHARS) return null
  try {
    return JSON.parse(input, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined
      return value
    })
  } catch {
    return null
  }
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

export const handler: Handler = async (event, context): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers: TEXT_HEADERS, body: 'Method Not Allowed' }
  }

  const user = context.clientContext?.user
  if (!user?.sub) {
    return { statusCode: 401, headers: TEXT_HEADERS, body: 'Unauthorized' }
  }

  if (!event.body) {
    return { statusCode: 400, headers: TEXT_HEADERS, body: 'Missing body' }
  }

  if (event.body.length > MAX_BODY_CHARS) {
    return { statusCode: 413, headers: TEXT_HEADERS, body: 'Payload too large' }
  }

  const parsed = safeParseJSON(event.body) as SavePayload | null
  if (!parsed || parsed.state === undefined) {
    return { statusCode: 400, headers: TEXT_HEADERS, body: 'Invalid payload' }
  }

  // Evita salvar "state" como primitivo solto
  if (!isPlainObject(parsed.state)) {
    return { statusCode: 400, headers: TEXT_HEADERS, body: 'Invalid state' }
  }

  // Confere tamanho real serializado (evita inserir payload gigante no banco)
  const serialized = JSON.stringify(parsed.state)
  if (serialized.length > MAX_BODY_CHARS) {
    return { statusCode: 413, headers: TEXT_HEADERS, body: 'State too large' }
  }

  const sql = neon()

  await sql`
    INSERT INTO public.finance_states (user_sub, state, updated_at)
    VALUES (${user.sub}, ${parsed.state as any}, now())
    ON CONFLICT (user_sub)
    DO UPDATE SET state = EXCLUDED.state, updated_at = now()
  `

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({ ok: true }),
  }
}
