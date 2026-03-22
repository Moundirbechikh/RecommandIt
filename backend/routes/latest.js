// routes/latest.js
const express = require("express");
const Movie = require("../models/Movie");
const Rate = require("../models/Rate");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1️⃣ Récupérer les 20 derniers films ajoutés par les utilisateurs
    const latestMovies = await Movie.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // 2️⃣ Calculer la moyenne des notes pour chaque film
    const moviesWithRatings = await Promise.all(
      latestMovies.map(async (movie) => {
        const rates = await Rate.find({ "ratings.filmId": String(movie.movieId) }).lean();

        let allRatings = [];
        rates.forEach(r => {
          r.ratings.forEach(rt => {
            if (rt.filmId === String(movie.movieId)) {
              allRatings.push(rt.note);
            }
          });
        });

        const avgRating = allRatings.length > 0
          ? allRatings.reduce((sum, n) => sum + n, 0) / allRatings.length
          : 0;

        return { ...movie, avgRating };
      })
    );

    // 3️⃣ Trier par date DESC puis moyenne DESC
    const sorted = moviesWithRatings.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.year);
      const dateB = new Date(b.createdAt || b.year);

      if (dateB - dateA !== 0) return dateB - dateA;
      return b.avgRating - a.avgRating;
    });

    // 4️⃣ Retourner les 12 premiers films
    const finalMovies = sorted.slice(0, 12).map((m) => {
      return {
        movieId: m.movieId,
        title: m.title,
        year: m.year,
        genres: m.genres || [],
        description: m.description,
        backdrop: m.backdrop,
        rating: m.avgRating
      };
    });

    res.json(finalMovies);
  } catch (err) {
    console.error("❌ Erreur récupération derniers films:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
