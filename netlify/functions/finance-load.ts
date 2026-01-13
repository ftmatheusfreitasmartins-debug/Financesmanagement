import type { Handler, HandlerResponse } from '@netlify/functions'
import { neon } from '@netlify/neon'

type FinanceRow = { user_sub: string; state: unknown; updated_at: string }

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

export const handler: Handler = async (event, context): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: TEXT_HEADERS, body: 'Method Not Allowed' }
  }

  const user = context.clientContext?.user
  if (!user?.sub) {
    return { statusCode: 401, headers: TEXT_HEADERS, body: 'Unauthorized' }
  }

  const sql = neon()

  const rows = (await sql`
    SELECT user_sub, state, updated_at
    FROM public.finance_states
    WHERE user_sub = ${user.sub}
    LIMIT 1
  `) as FinanceRow[]

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify({ ok: true, data: rows[0] ?? null }),
  }
}
