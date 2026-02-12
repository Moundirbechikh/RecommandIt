import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaTags, FaStar, FaTimes } from "react-icons/fa";

function FilmCard({ movie, showActions = true, isFavorite = false, hideRating = false }) {
  const [expanded, setExpanded] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [rating, setRating] = useState(
    typeof movie.rating === "number" && !Number.isNaN(movie.rating) ? movie.rating : null
  );

  const genreNames = Array.isArray(movie.genres)
    ? movie.genres
    : typeof movie.genres === "string"
    ? movie.genres.split("|")
    : [];

  const backdrop = movie.backdrop
    ? `url(${movie.backdrop})`
    : movie.backdrop_path
    ? `url(https://image.tmdb.org/t/p/w780${movie.backdrop_path})`
    : "linear-gradient(135deg, rgba(0,0,0,0.6), rgba(60,60,60,0.6))";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/rates", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const match = data.find((r) => String(r.filmId) === String(movie.movieId));
          if (match && typeof match.note === "number" && !Number.isNaN(match.note)) {
            setRating(match.note);
          }
        }
      })
      .catch(() => {});
  }, [movie.movieId]);

  const handleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vous devez être connecté pour ajouter un favori.");
      return;
    }
    try {
      if (!favorite) {
        const res = await fetch("https://recommandit.onrender.com/api/user/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId: movie.movieId }),
        });
        if (!res.ok) throw new Error("Erreur ajout favori");
        setFavorite(true);
      } else {
        const res = await fetch(
          `https://recommandit.onrender.com/api/user/favorites/${movie.movieId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Erreur suppression favori");
        setFavorite(false);
      }
    } catch (err) {
      console.error("❌ Erreur API Favoris:", err.message);
    }
  };

  const handleRate = async (newRating) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vous devez être connecté pour noter un film.");
      return;
    }
    const parsed = parseFloat(newRating);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 5) {
      return;
    }

    try {
      const res = await fetch("https://recommandit.onrender.com/api/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filmId: movie.movieId, note: parsed }),
      });
      if (!res.ok) throw new Error("Erreur enregistrement note");
      await res.json();
      setRating(parsed);
    } catch (err) {
      console.error("❌ Erreur API Note:", err.message);
    }
  };

  const hasUserRating = typeof rating === "number" && !Number.isNaN(rating);

  return (
    <div
      className="relative rounded-2xl shadow-xl overflow-hidden bg-white/20 backdrop-blur-xl 
                 w-full sm:w-64 min-h-[250px] sm:min-h-[300px]"
      style={{
        backgroundImage: backdrop,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45"></div>

      <div className="relative flex flex-col h-full text-white">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-2xl font-parisienne mb-3 leading-tight">
            {movie.title}
          </h2>

          <div className="flex items-center gap-2 text-sm sm:text-base font-cursive mb-2">
            <FaCalendarAlt />
            {movie.year
              ? movie.year
              : movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "N/A"}
          </div>

          <div className="flex items-center gap-2 text-sm sm:text-base font-cursive mb-4">
            <FaTags />
            {genreNames.length ? genreNames.join(", ") : "Genre indisponible"}
          </div>

          {expanded && showActions && (
            <p className="mt-2 text-xs sm:text-sm font-cursive bg-black/55 p-3 rounded-lg animate-fadeIn">
              {movie.description || movie.overview || "Description indisponible."}
            </p>
          )}
        </div>

        {showActions && (
          <div className="w-full px-4 sm:px-6 pb-2 mt-auto">
            <div className="flex justify-end items-center gap-2">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-white text-black font-bold font-cursive 
                           hover:bg-black hover:text-white transition-colors text-xs sm:text-sm"
              >
                {expanded ? "Fermer" : "Voir plus"}
              </button>

              <button
                onClick={handleFavorite}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                  favorite ? "bg-yellow-400 text-black" : "bg-white text-black hover:bg-yellow-400"
                }`}
              >
                <FaStar />
              </button>

              {hideRating ? null : hasUserRating ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500 text-black flex items-center justify-center font-bold text-xs sm:text-sm">
                  {rating}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-500 text-black flex items-center justify-center">
                    <FaTimes />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    onChange={(e) => handleRate(e.target.value)}
                    placeholder="Note"
                    className="w-14 sm:w-16 text-center text-black text-xs sm:text-sm border border-gray-300 rounded bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilmCard;
