import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

type SavePayload = { state: unknown };

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== "PUT") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const user = context.clientContext?.user;
  if (!user?.sub) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  if (!event.body) {
    return { statusCode: 400, body: "Missing body" };
  }

  let payload: SavePayload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (payload?.state === undefined) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  const sql = neon();

  await sql`
    INSERT INTO public.finance_states (user_sub, state, updated_at)
    VALUES (${user.sub}, ${payload.state as any}, now())
    ON CONFLICT (user_sub)
    DO UPDATE SET state = EXCLUDED.state, updated_at = now()
  `;

  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true }),
  };
};
