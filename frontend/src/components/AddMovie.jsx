import React, { useState, useEffect } from "react";

function AddMovieGlass() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // ✅ Vérifier combien de films ajoutés cette semaine
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("https://recommandit.onrender.com/api/movies/count", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setCount(data.count);
      } catch (err) {
        console.error("Erreur fetch count:", err);
      }
    };
    fetchCount();
  }, []);

  const GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  };

  const searchMovies = async (q) => {
    setQuery(q);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://recommandit.onrender.com/api/tmdb/search?q=${q}`);
      const data = await res.json();
      if (data.results) {
        setSuggestions(data.results.slice(0, 5));
      }
    } catch (err) {
      console.error("Erreur TMDB:", err);
    }
  };

  const selectMovie = async (movie) => {
    try {
      const res = await fetch(`https://recommandit.onrender.com/api/tmdb/details/${movie.id}`);
      const data = await res.json();
      const actors = data.actors || [];
      setSelectedMovie({ ...data, actors });
      setQuery(movie.title);
      setSuggestions([]);
    } catch (err) {
      console.error("Erreur TMDB details:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMovie || !rating) {
      setMessage("⚠️ Veuillez sélectionner un film et donner une note.");
      return;
    }

    const genres =
      selectedMovie.genres?.map((g) => g.name) ||
      selectedMovie.genre_ids?.map((id) => GENRE_MAP[id]).filter(Boolean) ||
      [];

    const payload = {
      title: selectedMovie.title || "",
      year: selectedMovie.release_date?.slice(0, 4) || "",
      description: selectedMovie.overview || "",
      backdrop: selectedMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${selectedMovie.backdrop_path}`
        : "",
      rating: parseFloat(rating),
      genres,
      actors: selectedMovie.actors || [],
    };

    console.log("📤 Payload envoyé:", payload);

    try {
      const res = await fetch("https://recommandit.onrender.com/api/movies/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("📥 Réponse backend:", data);

      if (data.success) {
        setMessage("✅ Film ajouté avec succès !");
        setCount(count + 1);
        setShowForm(false);
        setQuery("");
        setSelectedMovie(null);
        setRating("");
        setSuggestions([]);
      } else if (data.error === "limit") {
        setMessage("❌ Vous avez déjà ajouté 2 films cette semaine.");
        setShowForm(false);
        setCount(2);
      } else {
        setMessage("❌ Erreur lors de l’ajout du film.");
      }
    } catch (err) {
      console.error("Erreur ajout film:", err);
      setMessage("❌ Erreur serveur.");
    }
  };

  // ✅ Un seul bouton dès le départ
  if (!showForm) {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => {
            if (count < 2) setShowForm(true);
          }}
          disabled={count >= 2}
          className={`font-bold py-3 rounded-xl shadow-lg transition ${
            count >= 2
              ? "bg-gray-400 text-white cursor-not-allowed p-3"
              : "bg-black text-white hover:scale-105 hover:bg-gray-800 p-3"
          }`}
        >
          {count >= 2 ? "Limite atteinte (2 films/semaine)" : "➕ Ajouter un film"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center items-center h-fit">
      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-lg bg-white/30 border border-white/40 rounded-2xl shadow-xl p-8 w-full max-w-lg flex flex-col gap-6 relative"
      >
        {/* Bouton X rouge pour fermer */}
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="absolute top-4 right-4 text-red-600 text-2xl font-bold hover:text-red-800"
        >
          ✖
        </button>

        <h1 className="text-4xl font-parisienne text-black text-center drop-shadow-lg">
          🎬 Ajouter un film
        </h1>

        {/* Champ titre */}
        <input
          type="text"
          value={query}
          onChange={(e) => searchMovies(e.target.value)}
          placeholder="Titre du film..."
          className="p-3 rounded-xl border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-black text-black font-semibold placeholder-gray-600"
        />
        {suggestions.length > 0 && (
          <ul className="rounded-xl bg-white/80 border border-gray-300 shadow-md text-black">
            {suggestions.map((movie) => (
              <li
                key={movie.id}
                onClick={() => selectMovie(movie)}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-black hover:text-white rounded-xl transition"
              >
                {movie.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="w-10 h-auto rounded"
                  />
                )}
                <span>
                  {movie.title} ({movie.release_date?.slice(0, 4)})
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Champ note */}
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-black text-black font-cursive"
        >
          <option value="">Choisir une note</option>
          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>

        {message && (
          <p className="text-center font-semibold text-black">{message}</p>
        )}

        <button
          type="submit"
          className="bg-black text-white font-bold py-3 rounded-xl hover:scale-105 hover:bg-gray-800 transition shadow-lg"
        >
          ➕ Ajouter le film
        </button>
      </form>
    </div>
  );
}

export default AddMovieGlass;
