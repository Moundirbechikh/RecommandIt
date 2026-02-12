import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Firstpage from "./pages/Firstpage";
import Dashboard from "./pages/Dashbord";
import Connexion from "./pages/connexion";
import Navbar from "./components/Navbar";
import Films from "./components/Films";
import Profile from "./components/Profile";
import MainSections from "./components/MainSections";

function App() {
  // Initialiser directement avec le token pour éviter le flash
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier le token au montage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("https://recommandit.onrender.com/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token invalide ou expiré");
          return res.json();
        })
        .then((data) => {
          setIsAuthenticated(true);
          setUser(data.user);
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Déconnexion automatique après 15 min d’inactivité
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLogout();
      }, 15 * 60 * 1000); // 15 minutes
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer(); // initialiser

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("token"); // supprimer le token
    window.location.href = "/"; // retour à Firstpage
  };

  if (loading) {
    // Écran neutre pendant la vérification du token
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-parisienne">Chargement...</p>
      </div>
    );
  }

  return (
    <Router>
      {/* Navbar toujours visible */}
      <div className="flex flex-row justify-center">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} />
      </div>

      {/* Routes */}
      <Routes>
      <Route
  path="/"
  element={isAuthenticated ? <Dashboard user={user} onLogout={handleLogout} /> : <Firstpage />}
/>

        <Route path="/connexion" element={<Connexion onLogin={handleLogin} />} />
        <Route path="/Films" element={<Films />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/" element={<MainSections />} />
        <Route path="/films/:section" element={<Films />} />
      </Routes>
    </Router>
  );
}

export default App;
