import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

export const handler: Handler = async (_event, context) => {
  const user = context.clientContext?.user;
  if (!user?.sub) return { statusCode: 401, body: "Unauthorized" };

  const sql = neon(); // usa NETLIFY_DATABASE_URL automaticamente [web:113]

  const rows = await sql<
    { user_sub: string; state: any; updated_at: string }[]
  >`SELECT user_sub, state, updated_at
    FROM public.finance_states
    WHERE user_sub = ${user.sub}
    LIMIT 1`;

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true, data: rows[0] ?? null }),
  };
};
