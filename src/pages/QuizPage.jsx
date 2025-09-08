import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/quizPage.module.css";
import { fetchAllQuizzes, getToken, fetchProgress } from "../services/api";

const MY_QUESTIONS = [
  "Hvornår blev Medieskolen oprettet?",
  "Hvilken uddannelse kan man tage på Medieskolen?",
];

function extractList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

function normalizeQuestions(list) {
  if (!Array.isArray(list) || !list.length) return null;

  const questions = list
    .map((q) => {
      const opts = (q.options || []).map((o) => (typeof o === "string" ? o : o?.text));
      const correctFromText = q.correctAnswer || null;
      const correctFromId =
        (q.options || []).find((o) => o && o._id && q.correctOptionId && o._id === q.correctOptionId)?.text || null;

      return {
        question: q.question,
        options: (opts || []).filter(Boolean),
        correctAnswer: correctFromText || correctFromId || null,
      };
    })
    .filter((x) => x && x.question && x.options?.length);

  return questions.length ? { id: "live", questions } : null;
}

function parseProgress(raw) {
  const src = raw && typeof raw === "object" && Array.isArray(raw.data) === false ? (raw.data || raw) : raw;
  if (!src || typeof src !== "object") return null;

  const current =
    src.currentQuiz ?? src.current ?? src.index ?? null;
  const next =
    src.nextQuiz ?? src.next ?? src.nextId ?? null;
  const done =
    src.done ?? (next == null && current != null) ?? false;

  return { current, next, done };
}

export default function QuizPage() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState("in");


  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setError("");
      setQuiz(null);
      setCurrentIdx(0);
      setSelected(null);
      setSubmitted(false);
      setIsCorrect(false);
      setFinished(false);
      setPhase("in");

      if (!getToken()) {
        setLoading(false);
        setError("Ingen token. Gå til start og indtast navn.");
        return;
      }

      const uid = localStorage.getItem("userId");
      if (uid) {
        try {
          const p = await fetchProgress(uid);
          if (!ignore) setProgress(parseProgress(p));
        } catch {
        }
      }

      try {
        const raw = await fetchAllQuizzes();
        if (ignore) return;
        const all = extractList(raw);
        if (!all.length) {
          setError("API er tom (ingen quizzes).");
          return;
        }

        const targets = MY_QUESTIONS.map((s) => s.trim().toLowerCase());
        const mine = all.filter((q) =>
          targets.includes(String(q.question || "").trim().toLowerCase())
        );

        const list = mine.length ? mine : all;
        const norm = normalizeQuestions(list);
        if (!norm) setError("Ingen quiz fundet.");
        else setQuiz(norm);
      } catch (e) {
        const msg = String(e?.message || "");
        if (/Unauthorized|401|403/i.test(msg)) {
          setError("Adgang nægtet. Gå til start og log ind igen.");
        } else {
          setError(msg || "Kunne ikke hente data.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
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
        <div className={styles.card}>
          <p className={styles.error}>{error || "Kunne ikke hente data."}</p>
          <button className={styles.primary} onClick={() => navigate("/")}>
            Til start
          </button>
        </div>
      </main>
    );
  }

  const q = quiz.questions[currentIdx];

  function handleOption(opt) {
    if (submitted) return;
    setSelected(opt);
  }

  async function handleSubmit() {
    if (selected == null) return;
    const ok = q.correctAnswer ? selected === q.correctAnswer : false;
    setIsCorrect(ok);
    setSubmitted(true);

    if (ok) {
      const viewMs = 1200;
      const fadeMs = 400;

      setTimeout(() => setPhase("out"), viewMs);
      setTimeout(async () => {
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

        const uid = localStorage.getItem("userId");
        if (uid) {
          try {
            const p = await fetchProgress(uid);
            setProgress(parseProgress(p));
          } catch {
          }
        }
      }, viewMs + fadeMs);
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>QR Quiz!</h1>

      {/* {progress && (
        <section className={`${styles.block} ${styles.fadeIn}`} style={{ marginBottom: 12 }}>
          <div className={styles.card}>
            <h3 className={styles.question} style={{ marginBottom: 6 }}>Din progression</h3>
            {progress.done ? (
              <p className={styles.muted}>Du har gennemført alle quizzes.</p>
            ) : (
              <>
                {progress.current != null && (
                  <p className={styles.muted}>Nuværende quiz: {String(progress.current)}</p>
                )}
                {progress.next != null && (
                  <p className={styles.muted}>Næste quiz: {String(progress.next)}</p>
                )}
              </>
            )}
          </div>
        </section>
      )} */}

      {!finished ? (
        <section
          key={currentIdx}
          className={`${styles.block} ${phase === "in" ? styles.fadeIn : styles.fadeOut}`}
        >
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
              onClick={() => navigate(`/next/live`)}
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
