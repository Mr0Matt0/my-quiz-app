const BASE = (import.meta.env.VITE_API_BASE || "https://quiz-tpjgk.ondigitalocean.app").replace(/\/+$/, "");

// GET one quiz
export async function fetchQuizById(id) {
  const res = await fetch(`${BASE}/quiz/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// POST an answer (optional, if backend supports)
export async function submitAnswer(quizId, answer) {
  const res = await fetch(`${BASE}/quiz/${quizId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answer),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// CREATE user
export async function createUser(name) {
  const res = await fetch(`${BASE}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// (optional) GET all users
export async function fetchUsers() {
  const res = await fetch(`${BASE}/users`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
