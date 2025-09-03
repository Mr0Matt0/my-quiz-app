import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/NextHintPage.module.css";

export default function NextHintPage() {
  const navigate = useNavigate();

  const hintText = "Gå til biblioteket og find QR-koden ved indgangen.";
  const canContinue = true;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Næste QR-kode</h1>

      <div className={styles.card}>
        <section className={styles.section}>
          <h2 className={styles.hintTitle}>Hint</h2>
          <p className={styles.subtitle}>Din næste ledetråd</p>

          <div className={styles.mapBox}>
            {/* <img src="#" 
            alt="Kort over biblioteket" 
            className={styles.mapImage}/> */}
          </div>

          <div className={styles.hintBox}>{hintText}</div>
        </section>

        <button
          type="button"
          onClick={() => (canContinue ? navigate("/quiz/2") : navigate("/"))}
          className={styles.primary}
        >
          {canContinue ? "Fortsæt" : "Afslut"}
        </button>
      </div>
    </main>
  );
}
