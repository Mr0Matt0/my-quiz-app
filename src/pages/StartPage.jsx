import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/startPage.module.css";
import { registerUser, loginByName, getToken } from "../services/api";

export default function StartPage() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleStart(e) {
    e.preventDefault();
    setErr("");
    const n = name.trim();
    if (!n) return;

    try {
      setBusy(true);
      localStorage.setItem("playerName", n);

      await registerUser(n);

      if (!getToken()) {
        try { await loginByName(n); } catch {}
      }
      if (!getToken()) {
        throw new Error("Serveren returnerede ingen token. Prøv igen med et andet navn, eller prøv igen om lidt.");
      }

      navigate("/quiz/99");
    } catch (ex) {
      setErr(ex?.message || "Kunne ikke oprette bruger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>QR Quiz!</h1>
      <div className={styles.card}>
        <form onSubmit={handleStart} className={styles.form}>
          <label className={styles.label} htmlFor="playerName">Skriv dit navn</label>
          <input
            id="playerName"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            placeholder="Indtast dit navn"
          />
          {err && <p className={styles.error}>{err}</p>}
          <button className={styles.primary} disabled={!name.trim() || busy}>
            {busy ? "Starter…" : "Start quiz"}
          </button>
        </form>
      </div>
    </main>
  );
}
