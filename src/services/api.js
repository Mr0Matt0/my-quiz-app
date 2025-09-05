const BASE = (import.meta.env.VITE_API_BASE || "https://quiz-tpjgk.ondigitalocean.app").replace(/\/+$/, "");

// ---------- token helpers ----------
export const getToken = () => localStorage.getItem("token") || "";
export const setToken = (t) => t && localStorage.setItem("token", t);
export const clearAuth = (keepName = true) => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  if (!keepName) localStorage.removeItem("playerName");
};

// ---------- register user ----------
export async function registerUser(name) {
  const res = await fetch(`${BASE}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const body = await res.json().catch(() => ({}));

  // if backend says name is taken
  if (res.status === 409 || body?.message?.toLowerCase().includes("allerede")) {
    throw new Error("Brugernavn allerede i brug");
  }

  if (!res.ok) {
    const msg = body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // save token if returned
  const token = body?.token || body?.data?.token;
  if (token) setToken(token);

  if (body?._id) localStorage.setItem("userId", body._id);
  return body;
}

// ---------- authed fetch ----------
async function auth(path, opts = {}) {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");
  return fetch(`${BASE}${path}`, { ...opts, headers, cache: "no-store" });
}

// ---------- quiz API ----------
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
