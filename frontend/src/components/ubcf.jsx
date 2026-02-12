import React, { useState, useEffect, useRef } from "react";
import FilmCard from "./FilmCard";

function Ubcf() {
  const [isGrid, setIsGrid] = useState(false);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardWidth = 280;
  const gap = 4;
  const speed = 1;

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("https://recommandit.onrender.com/api/filtrage/ubcf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ top_n: 20, k: 41 }),
        });

        if (!response.ok) {
          setMovies([]);
          return;
        }

        const data = await response.json();

        if (data && Array.isArray(data.recommendations)) {
          setMovies(data.recommendations);
        } else {
          setMovies([]);
        }
      } catch (err) {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

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
        <h1>Inspiré par des gens comme vous </h1>
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

export default Ubcf;
