import React, { useState, useEffect } from "react";
import FilmCard from "./FilmCard";
import { NavLink } from "react-router-dom";

const getPositionClass = (pos) => {
  if (pos === "center") return "scale-100 z-10 opacity-100";
  if (pos === "left")
    return "translate-x-[-120px] md:translate-x-[-150px] md:scale-90 scale-[0.8] opacity-50 z-0";
  if (pos === "right")
    return "translate-x-[120px] md:translate-x-[150px] md:scale-90 scale-[0.8] opacity-50 z-0";
  return "opacity-0 pointer-events-none";
};

function FilmSection({ title, movies, link }) {
  const [index, setIndex] = useState(1); // commence avec le film du milieu

  // ✅ Préparer les films pour le carrousel
  let displayMovies = [];
  if (movies.length === 0) {
    displayMovies = [];
  } else if (movies.length === 1) {
    displayMovies = [movies[0], movies[0], movies[0]];
  } else if (movies.length === 2) {
    displayMovies = [movies[0], movies[1], movies[0]]; // duplique le premier
  } else {
    displayMovies = movies;
  }

  // Animation auto toutes les 3s
  useEffect(() => {
    if (displayMovies.length > 0) {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % displayMovies.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [displayMovies.length]);

  // Déterminer position gauche/centre/droite
  const getPosition = (i) => {
    if (i === index) return "center";
    if (i === (index - 1 + displayMovies.length) % displayMovies.length) return "left";
    if (i === (index + 1) % displayMovies.length) return "right";
    return "hidden";
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full py-5 rounded-xl mt-12">
      {/* Titre */}
      <h2 className="text-3xl md:text-4xl font-parisienne text-black mb-4 font-semibold">{title}</h2>

      {/* Carrousel ou message */}
      {displayMovies.length === 0 ? (
        <div className="text-center text-gray-600 font-cursive mb-6">
          Aucun film trouvé. <NavLink to="/films" className="text-black underline">Aller voir les films</NavLink>
        </div>
      ) : (
        <div className="relative w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl h-72 flex justify-center items-end">
          {displayMovies.map((movie, i) => {
            const pos = getPosition(i);
            return (
              <div
                key={`${movie.id}-${i}`} // ✅ clé unique même si dupliqué
                className={`absolute transition-all duration-700 cursor-pointer ${getPositionClass(pos)}`}
                onClick={() => setIndex(i)}
              >
                {/* En carrousel → pas d’actions */}
                <FilmCard movie={movie} showActions={false} />
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton Voir tous */}
      <NavLink
        to={link}
        className="px-6 py-2 rounded-lg font-parisienne bg-black text-white hover:bg-white hover:text-black transition-transform hover:scale-105"
      >
        Voir tous les films
      </NavLink>
    </div>
  );
}

export default FilmSection;
