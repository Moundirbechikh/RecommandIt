import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://recommandit.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Connexion réussie : on récupère l'utilisateur et le token
        setMessage("✅ Connexion réussie !");
        localStorage.setItem("token", data.token); // stocker le JWT
        onLogin(data.user); // passer l'utilisateur au parent
        navigate("/"); // rediriger vers le Dashboard
      } else {
        setMessage(`❌ Erreur: ${data.error || "Identifiants invalides"}`);
      }
    } catch (err) {
      console.error("Erreur login:", err);
      setMessage("❌ Erreur serveur, réessayez plus tard.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-parisienne text-center mb-6 text-black">
        Connexion
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FaEnvelope className="text-gray-700 text-base" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <FaLock className="text-gray-700 text-base" />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>

        <button
          type="submit"
          className="bg-gradient-to-r from-black via-gray-700 to-white text-white py-2 rounded-lg hover:scale-105 transition-transform text-base font-parisienne"
        >
          Se connecter
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center font-cursive text-sm text-black">{message}</p>
      )}
    </div>
  );
}

export default Login;

