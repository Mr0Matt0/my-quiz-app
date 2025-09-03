import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/StartPage.module.css";
import { createUser } from "../services/api"; 

export default function StartPage() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleStart(e){
    e.preventDefault();
    setErr("");
    const trimmed = name.trim();
    if (!trimmed) return;

    // always keep the name locally so the quiz works even if API dies
    localStorage.setItem("playerName", trimmed);

    try {
      setBusy(true);
      const user = await createUser(trimmed);
      if (user && user._id) {
        localStorage.setItem("userId", user._id);
      } else {
        // API responded but didn’t return an _id — not your fault, still proceed
        console.warn("[createUser] No _id in response:", user);
      }
    } catch (e) {
      // don’t block the game just because their API sneezed
      console.warn("Failed to create user:", e);
      setErr("Kunne ikke gemme bruger på serveren. Du kan stadig spille.");
    } finally {
      setBusy(false);
    }

    navigate("/quiz/1");
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>QR Quiz!</h1>

      <div className={styles.card}>
        <form onSubmit={handleStart} className={styles.form}>
          <label htmlFor="playerName" className={styles.label}>
            Skriv dit navn
          </label>
          <input
            id="playerName"
            type="text"
            placeholder="Indtast dit navn her"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            disabled={busy}
          />

          {err && <p className={styles.error} style={{ marginTop: 8 }}>{err}</p>}

          <button
            type="submit"
            className={styles.primary}
            disabled={!name.trim() || busy}
          >
            {busy ? "Opretter…" : "Start quiz"}
          </button>
        </form>
      </div>
    </main>
  );
}
