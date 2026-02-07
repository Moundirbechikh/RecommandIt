import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FilmCard from "./FilmCard";
import AddMovieGlass from "./AddMovie"; // ✅ ton formulaire

function Films() {
  const { section } = useParams();
  const [allMovies, setAllMovies] = useState([]);
  const [moviesData, setMoviesData] = useState([]);
  const [favorites, setFavorites] = useState([]); // ✅ liste des favoris
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");

  // ✅ états pour le bouton/formulaire


  useEffect(() => {
    let endpoint = "http://localhost:5000/api/movies";
    if (section === "favoris") endpoint = "http://localhost:5000/api/user/favorites";
    else if (section === "recents") endpoint = "http://localhost:5000/api/movies/latestAdd";
    else if (section === "tendances") endpoint = "http://localhost:5000/api/movies/latest";

    const token = localStorage.getItem("token") || "";

    // Charger films
    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
        return res.json();
      })
      .then(async (data) => {
        if (Array.isArray(data)) {
          // ✅ Charger aussi les notes de l’utilisateur
          let userRatings = [];
          try {
            const resRates = await fetch("http://localhost:5000/api/rates", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resRates.ok) {
              userRatings = await resRates.json();
            }
          } catch (err) {
            console.error("Erreur fetch notes:", err);
          }

          // ✅ Fusionner les notes dans les films
          const enriched = data.map((movie) => {
            const userNote = userRatings.find(
              (r) => String(r.filmId) === String(movie.movieId)
            );
            return { ...movie, rating: userNote ? userNote.note : null };
          });

          setAllMovies(enriched);
          const shuffled = [...enriched].sort(() => 0.5 - Math.random());
          setMoviesData(shuffled.slice(0, 32));
        } else {
          setAllMovies([]);
          setMoviesData([]);
        }
      })
      .catch((err) => console.error("Erreur fetch films:", err));

    // Charger favoris (sauf si on est déjà dans la section favoris)
    if (section !== "favoris") {
      fetch("http://localhost:5000/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((favData) => {
          if (Array.isArray(favData)) {
            setFavorites(favData.map((f) => f.movieId)); // ✅ stocker juste les IDs
          }
        })
        .catch((err) => console.error("Erreur fetch favoris:", err));
    }
  }, [section]);

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // ✅ Recherche sur TOUS les films
  const filteredMovies = allMovies.filter((movie) => {
    const matchesSearch = movie.title?.toLowerCase().includes(search.toLowerCase());
    const matchesGenres =
      selectedGenres.length > 0
        ? selectedGenres.every((g) =>
            Array.isArray(movie.genres)
              ? movie.genres.includes(g)
              : movie.genres?.split("|").includes(g)
          )
        : true;
    const year = parseInt(movie.year || new Date(movie.release_date).getFullYear());
    const matchesYear =
      (yearMin ? year >= parseInt(yearMin) : true) &&
      (yearMax ? year <= parseInt(yearMax) : true);
    return matchesSearch && matchesGenres && matchesYear;
  });

  const allGenres = [
    "Action","Adventure", "Drama", "Comedy", "Sci-Fi", "Fantasy", "Crime", "Horror",
    "Children", "Animation", "Thriller", "Documentary", "Romance","Western","War","Musical","Film-Noir"
  ];

  return (
    <section className="flex flex-col items-center p-8 bg-gradient-to-b border-t-2 border-black from-stone-200 via-stone-300 to-stone-400 min-h-screen">
      <h1 className="text-4xl font-parisienne mb-8 text-black">
        🎬 {section === "favoris" ? "Mes Favoris" : section === "recents" ? "Récemment Notés" : "Tendances"}
      </h1>

      {/* Barre de recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 w-full max-w-5xl">
        <input
          type="text"
          placeholder="Rechercher par titre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black font-cursive"
        />
        <input
          type="number"
          placeholder="Année min"
          value={yearMin}
          onChange={(e) => setYearMin(e.target.value)}
          className="p-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black font-cursive w-32"
        />
        <input
          type="number"
          placeholder="Année max"
          value={yearMax}
          onChange={(e) => setYearMax(e.target.value)}
          className="p-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black font-cursive w-32"
        />
      </div>

      {/* Filtres par genres */}
      <div className="flex flex-wrap gap-4 mb-8">
        {allGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => toggleGenre(genre)}
            className={`px-4 py-2 rounded-lg font-cursive border ${
              selectedGenres.includes(genre)
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-400 hover:bg-black hover:text-white"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

{/* Ajouter un film */}
<div className=" w-full max-w-2xl mx-auto my-8">
  <AddMovieGlass />
</div>


      {/* Liste des films */}
      <div className="flex flex-wrap justify-center gap-8 items-start">
        {(search || selectedGenres.length > 0 || yearMin || yearMax ? filteredMovies : moviesData).map((movie) => (
          <FilmCard
            key={movie.movieId}
            movie={movie}
            showActions={true}
            isFavorite={section === "favoris" ? true : favorites.includes(movie.movieId)}
            hideRating={section === "tendances"} // ✅ ne pas afficher de note pour tendances
          />
        ))}
      </div>
    </section>
  );
}

export default Films;
