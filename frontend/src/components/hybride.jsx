import React, { useState, useEffect, useRef } from "react";
import FilmCard from "./FilmCard";

function Hybride() {
  const [isGrid, setIsGrid] = useState(false);
  const [offset, setOffset] = useState(0);
  const [movies, setMovies] = useState([]); // films recommandés
  const rafRef = useRef(null);

  // Réglages
  const cardWidth = 280; // largeur d’une card
  const gap = 4;         // marge horizontale
  const speed = 1;       // pixels par frame

  const itemWidth = cardWidth + gap;
  const cycleWidth = movies.length * itemWidth || 1; // éviter division par zéro

  // 🔥 Récupérer les recommandations depuis backend (route protégée)
  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const token = localStorage.getItem("token"); // JWT si utilisé
        const response = await fetch("https://recommandit.onrender.com/api/hybride", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            // Ne pas envoyer de favoris codés en dur ici :
            // le serveur Express doit récupérer les favoris de l'utilisateur connecté
            top_n: 20,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("FastAPI/Express error:", text);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setMovies(Array.isArray(data.recommendations) ? data.recommendations : []);
        } else {
          console.error("Erreur backend:", data);
        }
      } catch (err) {
        console.error("❌ Erreur fetch recommandations:", err);
      }
    }

    fetchRecommendations();
  }, []); // s'exécute au montage

  // Animation carrousel
  useEffect(() => {
    if (isGrid || movies.length === 0) return;

    const tick = () => {
      setOffset((prev) => {
        const next = prev + speed;
        // boucle propre : si dépasse cycleWidth, revenir à 0
        return next >= cycleWidth ? next - cycleWidth : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [isGrid, movies.length, cycleWidth]);

  return (
    <div className="w-full p-6 border-t-2 border-b-2 border-black">
      <div className="text-4xl font-parisienne text-black font-semibold mb-4">
        <h1>Meilleure Recommandation</h1>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={() => setIsGrid(!isGrid)}
          className="px-6 py-2 rounded-lg bg-black text-white font-parisienne hover:bg-white hover:text-black transition"
        >
          {isGrid ? "Retour au carrousel" : "Voir films"}
        </button>
      </div>

      {isGrid ? (
        // Mode grille → avec actions
        <div className="flex flex-row flex-wrap gap-3 justify-center">
          {movies.map((movie) => (
            <FilmCard key={movie.movieId || movie.id} movie={movie} showActions={true} />
          ))}
        </div>
      ) : (
        // Mode carrousel → sans actions
        <div className="overflow-hidden w-full">
          <div
            className="flex"
            style={{
              transform: `translateX(-${offset}px)`,
              willChange: "transform",
              width: `${cycleWidth * 2}px`,
            }}
          >
            {[...movies, ...movies].map((movie, index) => (
              <div key={index} className="mx-3" style={{ width: `${cardWidth}px` }}>
                <FilmCard movie={movie} showActions={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Hybride;
