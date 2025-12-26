import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

type FinanceRow = { user_sub: string; state: unknown; updated_at: string };

export const handler: Handler = async (event, context) => {
  const user = context.clientContext?.user;
  if (!user?.sub) return { statusCode: 401, body: "Unauthorized" };

  const sql = neon(); // usa NETLIFY_DATABASE_URL automaticamente
  const rows = (await sql`
    SELECT user_sub, state, updated_at
    FROM public.finance_states
    WHERE user_sub = ${user.sub}
    LIMIT 1
  `) as FinanceRow[];

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true, data: rows[0] ?? null }),
  };
};
