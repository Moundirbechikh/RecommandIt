import React, { useEffect, useState } from "react";
import { FaUserCircle, FaEnvelope } from "react-icons/fa";
import MovieRateCard from "./MovieRateCard";

function Profile({ user }) {
  const [ratedMovies, setRatedMovies] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    FirstName: user?.FirstName || "",
    LastName: user?.LastName || "",
    country: user?.country || "",
    username: user?.username || "",
    password: "",
  });

  const uniqueMovies = ratedMovies.filter(
    (movie, index, self) =>
      index === self.findIndex((m) => m.filmId === movie.filmId)
  );

  // ✅ Récupérer les films notés
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/rates/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        setRatedMovies(data);
      } catch (err) {
        console.error("Erreur fetch notes profil:", err);
      }
    };
    if (user) fetchRates();
  }, [user]);

  if (!user) {
    return (
      <section className="flex justify-center items-center h-screen bg-gradient-to-br from-stone-200 via-white to-stone-400">
        <div className="bg-white/30 shadow-2xl rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-parisienne text-black mb-4">Profil</h2>
          <p className="text-gray-700 font-cursive">Aucun utilisateur connecté.</p>
        </div>
      </section>
    );
  }

  const initials =
    (user.FirstName ? user.FirstName.charAt(0).toUpperCase() : "") +
    (user.LastName ? user.LastName.charAt(0).toUpperCase() : "");

  // ✅ Mettre à jour le profil
  const handleUpdate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log("Profil mis à jour:", data.user);
      setEditing(false);
    } catch (err) {
      console.error("Erreur update profil:", err);
    }
  };

  return (
    <section className="flex flex-col items-center min-h-screen bg-gradient-to-br from-stone-200 via-white to-stone-400 p-8">
      {/* ✅ Carte profil utilisateur */}
      <div className="bg-white/30 shadow-2xl rounded-2xl p-8 w-full max-w-md text-center mb-8">
        <FaUserCircle className="text-black mx-auto mb-4" size={80} />

        {editing ? (
          <div className="flex flex-col gap-4 text-left">
            <label className="font-semibold text-gray-700">Prénom</label>
            <input
              type="text"
              value={formData.FirstName}
              onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
              placeholder="Prénom"
              className="p-2 border rounded focus:ring-2 focus:ring-black"
            />

            <label className="font-semibold text-gray-700">Nom</label>
            <input
              type="text"
              value={formData.LastName}
              onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
              placeholder="Nom"
              className="p-2 border rounded focus:ring-2 focus:ring-black"
            />

            <label className="font-semibold text-gray-700">Pays</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Pays"
              className="p-2 border rounded focus:ring-2 focus:ring-black"
            />

            <label className="font-semibold text-gray-700">Nom d'utilisateur</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Nom d'utilisateur"
              className="p-2 border rounded focus:ring-2 focus:ring-black"
            />

            <label className="font-semibold text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Nouveau mot de passe"
              className="p-2 border rounded focus:ring-2 focus:ring-black"
            />

            <button
              onClick={handleUpdate}
              className="mt-4 px-6 py-2 rounded-lg bg-black text-white font-cursive hover:bg-white hover:text-black transition"
            >
              Sauvegarder
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-parisienne text-black mb-2">
              {user.FirstName} {user.LastName}
            </h2>
            {user.email && (
              <div className="flex items-center justify-center gap-2 text-gray-700 font-cursive mb-4">
                <FaEnvelope /> {user.email}
              </div>
            )}
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-black text-white font-bold text-xl mb-6 font-cursive">
              {initials || "?"}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 rounded-lg bg-black text-white font-cursive hover:bg-white hover:text-black transition"
            >
              Modifier le profil
            </button>
          </>
        )}
      </div>

      {/* ✅ Liste des films notés */}
      <h3 className="text-2xl font-bold text-black mb-4 font-parisienne">Vos films notés</h3>
      <div className="flex flex-wrap gap-6 justify-center">
        {ratedMovies.length > 0 ? (
          uniqueMovies.map((m) => (
            <MovieRateCard
              key={m.filmId}
              title={m.title}
              backdrop={m.backdrop}
              note={m.note}
              date={m.date}
            />
          ))
        ) : (
          <p className="text-gray-600">Vous n'avez pas encore noté de films.</p>
        )}
      </div>
    </section>
  );
}

export default Profile;
