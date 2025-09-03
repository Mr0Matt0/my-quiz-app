import React from "react";
import { Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import NextHintPage from "./pages/NextHintPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/quiz/:id" element={<QuizPage />} />
      <Route path="/next/:id" element={<NextHintPage />} />
    </Routes>
  );
}
