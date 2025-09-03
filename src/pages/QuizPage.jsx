import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/quizPage.module.css";

const BASE = (import.meta.env.VITE_API_BASE || "https://quiz-tpjgk.ondigitalocean.app").replace(/\/+$/, "");

// >>> Put YOUR exact question texts here 
const MY_QUESTIONS = [
  "Hvornår blev Medieskolen oprettet?",
  "Hvilken uddannelse kan man tage på Medieskolen?"
];

function extractList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

function normalize(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const questions = list
    .map((q) => {
      const opts = (q.options || []).map((o) => (typeof o === "string" ? o : o.text));
      const correctFromText = q.correctAnswer || null;
      const correctFromId =
        (q.options || []).find((o) => o && o._id && q.correctOptionId && o._id === q.correctOptionId)?.text || null;
      return {
        question: q.question,
        options: opts,
        correctAnswer: correctFromText || correctFromId || null,
      };
    })
    .filter((x) => x && x.question && Array.isArray(x.options) && x.options.length);
  return questions.length ? { id: "mine", questions } : null;
}

export default function QuizPage() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // one-at-a-time flow
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState("in");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    setQuiz(null);
    setCurrentIdx(0);
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
    setFinished(false);
    setPhase("in");

    fetch(`${BASE}/quiz`)
      .then(async (r) => {
        const txt = await r.text();
        if (!r.ok) throw new Error(`HTTP ${r.status}${txt ? ` :: ${txt.slice(0,160)}` : ""}`);
        try { return JSON.parse(txt); } catch { return null; }
      })
      .then((raw) => {
        if (ignore) return;

        const all = extractList(raw);
        if (!all.length) {
          setError("API er tom (ingen quizzes seedet).");
          return;
        }

        // Filter to YOUR questions by exact text (case-insensitive, trims whitespace)
        const targets = MY_QUESTIONS.map((s) => s.trim().toLowerCase());
        const mine = all.filter((q) => targets.includes(String(q.question || "").trim().toLowerCase()));

        const norm = normalize(mine);
        if (!norm) {
          setError("Dine spørgsmål blev ikke fundet i API'et.");
          return;
        }
        setQuiz(norm);
      })
      .catch((err) => !ignore && setError(err?.message || "Kunne ikke hente data"))
      .finally(() => !ignore && setLoading(false));

    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <main className={styles.container}>
        <p className={styles.muted}>Indlæser…</p>
      </main>
    );
  }
  if (error || !quiz) {
    return (
      <main className={styles.container}>
        <p className={styles.error}>{error || "Kunne ikke hente data"}</p>
      </main>
    );
  }

  const q = quiz.questions[currentIdx];

  function handleOption(opt) {
    setSelected(opt);
  }

  function handleSubmit() {
    if (selected == null) return;
    const ok = q.correctAnswer ? selected === q.correctAnswer : false;
    setIsCorrect(ok);
    setSubmitted(true);

    if (ok) {
      const viewMs = 1200;
      const fadeMs = 400;
      setTimeout(() => setPhase("out"), viewMs);
      setTimeout(() => {
        const last = currentIdx === quiz.questions.length - 1;
        if (last) {
          setFinished(true);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelected(null);
          setSubmitted(false);
          setIsCorrect(false);
          setPhase("in");
        }
      }, viewMs + fadeMs);
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>QR Quiz!</h1>

      {!finished ? (
        <section key={currentIdx} className={`${styles.block} ${phase === "in" ? styles.fadeIn : styles.fadeOut}`}>
          <div className={styles.card}>
            <h2 className={styles.question}>Question {currentIdx + 1}</h2>
            <p className={styles.subtitle}>{q.question}</p>

            <ul className={styles.options}>
              {q.options.map((opt, i) => {
                const sel = selected === opt;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => handleOption(opt)}
                      className={`${styles.option} ${sel ? styles.selected : ""}`}
                      aria-pressed={sel}
                    >
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.primary}
                disabled={selected == null}
              >
                Tjek svar
              </button>
            </div>

            {submitted && (
              <div className={styles.feedback}>
                {isCorrect ? (
                  <p className={styles.correct}>✔ Korrekt!</p>
                ) : (
                  <p className={styles.incorrect}>✖ Forkert, prøv igen.</p>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className={`${styles.block} ${styles.fadeIn}`}>
          <div className={styles.card}>
            <p className={styles.correct}>✔ Alle spørgsmål besvaret korrekt!</p>
            <button
              type="button"
              onClick={() => navigate(`/next/mine`)}
              className={styles.primary}
            >
              Næste QR-kode
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
