import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaGlobe, FaBriefcase } from "react-icons/fa";

function Register() {
  const [username, setUsername] = useState("");
  const [FirstName, setFirstName] = useState("");
  const [LastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [profession, setProfession] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://recommandit.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          FirstName,
          LastName,
          email,
          password,
          country,
          status: profession, // on envoie profession comme "status"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Utilisateur créé avec succès !");
        // Réinitialiser le formulaire
        setUsername("");
        setEmail("");
        setPassword("");
        setCountry("");
        setProfession("");
        setFirstName("");
        setLastName("");
      } else {
        setMessage(`❌ Erreur: ${data.error || "Impossible de créer l'utilisateur"}`);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setMessage("❌ Erreur serveur, réessayez plus tard.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-parisienne text-center mb-6 text-black">
        Inscription
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FaUser className="text-black text-base" />
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaUser className="text-black text-base" />
          <input
            type="text"
            placeholder="Prenom"
            value={FirstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaUser className="text-black text-base" />
          <input
            type="text"
            placeholder="Nom"
            value={LastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaEnvelope className="text-black text-base" />
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
          <FaLock className="text-black text-base" />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaGlobe className="text-black text-base" />
          <input
            type="text"
            placeholder="Pays"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 font-cursive text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaBriefcase className="text-black text-base" />
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="flex-1 text-black font-semibold p-2 rounded-lg border font-cursive border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 text-sm"
          >
            <option value="">Statut</option>
            <option value="etudiant">Étudiant</option>
            <option value="professionnel">Professionnel</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-black via-gray-700 to-white text-white py-2 rounded-lg hover:scale-105 transition-transform text-base font-parisienne"
        >
          S'inscrire
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center font-cursive text-sm text-black">{message}</p>
      )}
    </div>
  );
}

export default Register;
