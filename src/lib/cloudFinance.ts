export async function getJwt(): Promise<string> {
  const anyWin = window as any;
  const user = anyWin.netlifyIdentity?.currentUser?.();
  if (!user) throw new Error("Not authenticated");
  if (typeof user.jwt === "function") return await user.jwt(true);
  if (user.token?.access_token) return user.token.access_token;
  throw new Error("Missing token");
}

async function authed(url: string, init?: RequestInit) {
  const token = await getJwt();

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("content-type", "application/json");

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";

    if (ct.includes("text/html") || text.includes("<!DOCTYPE html")) {
      throw new Error(
        "Netlify Functions indisponível (provável 404 no next dev). Use `netlify dev` para CloudSync."
      );
    }

    throw new Error(text || `HTTP ${res.status}`);
  }

  return res;
}

export async function cloudLoad() {
  const res = await authed("/.netlify/functions/finance-load");
  return res.json();
}

export async function cloudSave(state: unknown) {
  const res = await authed("/.netlify/functions/finance-save", {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
  return res.json();
}
