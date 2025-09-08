const BASE = (import.meta.env.VITE_API_BASE || "https://quiz-tpjgk.ondigitalocean.app").replace(/\/+$/, "");

export const getToken = () => (localStorage.getItem("token") || "").trim();
export const setToken = (t) => {
  const s = (t == null ? "" : String(t)).replace(/[\r\n]/g, "").trim();
  if (s.length >= 16) localStorage.setItem("token", s);
};
export const clearAuth = (keepName = true) => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  if (!keepName) localStorage.removeItem("playerName");
};

const j = async (res) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt || null; }
};
const pickId = (x) => x?._id ?? x?.data?._id ?? x?.user?._id ?? x?.id ?? null;
const pickToken = (x) => {
  if (!x) return "";
  if (typeof x === "object") return x.token || x?.data?.token || x.jwt || x.accessToken || "";
  const s = String(x).replace(/[\r\n]/g, "").trim();
  const m = s.match(/^Bearer\s+(.+)$/i);
  return (m ? m[1] : s) || "";
};

async function raw(path, opts = {}) {
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    cache: "no-store",
    mode: "cors",
  });
}

async function auth(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${BASE}${path}`, { ...opts, headers, cache: "no-store", mode: "cors" });
}

export async function registerUser(name) {
  const n = String(name || "").trim();
  if (!n) throw new Error("Ugyldigt navn");

  const res = await raw("/user", { method: "POST", body: JSON.stringify({ name: n }) });
  const body = await j(res);

  if (res.status === 409 || (typeof body === "object" && /allerede/i.test(body?.message || ""))) {
    throw new Error("Brugernavn allerede i brug");
  }
  if (!res.ok) {
    throw new Error((typeof body === "object" && body?.message) ? body.message : `HTTP ${res.status}`);
  }

  const token = pickToken(body) || pickToken(res.headers.get("authorization"));
  if (token) setToken(token);
  const id = pickId(body);
  if (id) localStorage.setItem("userId", String(id));
  return body;
}

export async function loginByName(name) {
  const n = String(name || "").trim();
  if (!n) throw new Error("Ugyldigt navn");
  const res = await raw("/login", { method: "POST", body: JSON.stringify({ name: n }) });
  if (!res.ok) throw new Error("Login-endpoint ikke tilgængeligt");
  const body = await j(res);
  const token = pickToken(body) || pickToken(res.headers.get("authorization"));
  if (!token) throw new Error("Login gav ingen token");
  setToken(token);
  const id = pickId(body);
  if (id) localStorage.setItem("userId", String(id));
  return body;
}

export async function fetchAllQuizzes() {
  const r = await auth("/quiz");
  if (r.status === 401 || r.status === 403) throw new Error("Unauthorized");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function fetchProgress(userId) {
  const r = await auth(`/quiz/progress/${userId}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
