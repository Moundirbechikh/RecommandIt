import React, { useState, useEffect, useRef } from "react";
import FilmCard from "./FilmCard";

function Ibcf() {
  const [isGrid, setIsGrid] = useState(false);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardWidth = 280;
  const gap = 4;
  const speed = 1;

  // 🔥 Fetch IBCF
  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("https://recommandit.onrender.com/api/filtrage/ibcf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          // IBCF nécessite userRatings → on envoie une liste vide pour l’instant
          body: JSON.stringify({ top_n: 8, k: 41, userRatings: [] }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("❌ IBCF error:", text);
          setMovies([]);
          return;
        }

        const data = await response.json();

        if (Array.isArray(data.recommendations)) {
          setMovies(
            data.recommendations.map((rec, index) => ({
              movieId: rec.movieId || rec.id || index,
              title: rec.title || "",
              year: rec.year || "",
              genres: rec.genres || [],
              backdrop: rec.backdrop || rec.backdrop_path || "",
              description: rec.description || rec.overview || "",
              score: rec.score || 0,
            }))
          );
        } else {
          setMovies([]);
        }
      } catch (err) {
        console.error("❌ Fetch IBCF failed:", err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  // Carousel animation
  const itemWidth = cardWidth + gap;
  const cycleWidth = movies.length * itemWidth || 1;

  useEffect(() => {
    if (isGrid || movies.length === 0) return;

    const tick = () => {
      setOffset((prev) => {
        const next = prev + speed;
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
        <h1>Ceux qui partagent vos goûts ont adoré</h1>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={() => setIsGrid(!isGrid)}
          className="px-6 py-2 rounded-lg bg-black text-white font-parisienne hover:bg-white hover:text-black transition"
        >
          {isGrid ? "Retour au carrousel" : "Voir films"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement des recommandations…</div>
      ) : isGrid ? (
        // 🧩 GRID → favoris + voir plus + rating
        <div className="flex flex-row flex-wrap gap-3 justify-center">
          {movies.map((movie) => (
            <FilmCard
              key={movie.movieId}
              movie={movie}
              showActions={true}
              hideRating={false}
            />
          ))}
        </div>
      ) : (
        // 🎠 CAROUSEL → affichage simple
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
                <FilmCard
                  movie={movie}
                  showActions={false}
                  hideRating={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Ibcf;
