// routes/latest.js
const express = require("express");
const Movie = require("../models/Movie");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1) Récupérer les 20 derniers films ajoutés par les utilisateurs
    const latestMovies = await Movie.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const movieIds = latestMovies.map((m) => String(m.movieId));

    // 2) Charger le CSV
    const moviesMap = new Map();
    const filePath = path.join(__dirname, "../movies_enriched.csv");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier movies_enriched.csv introuvable" });
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const movieId = String(data.movieId);

        // On ne garde que les films présents dans MongoDB
        if (!movieIds.includes(movieId)) return;

        if (!moviesMap.has(movieId)) {
          moviesMap.set(movieId, {
            movieId: data.movieId,
            title: data.title,
            year: data.year,
            release_date: data.release_date,
            genres: data.genres ? data.genres.split("|") : [],
            description: data.description,
            backdrop: data.backdrop,
            ratingsCount: 0,
            _ratings: []
          });
        }

        const movie = moviesMap.get(movieId);

        movie.ratingsCount += 1;

        if (data.rating && !isNaN(data.rating)) {
          movie._ratings.push(parseFloat(data.rating));
        }
      })
      .on("end", () => {
        // 3) Calculer la moyenne des notes
        const movies = Array.from(moviesMap.values()).map((m) => {
          let avg = 0;
          if (m._ratings.length > 0) {
            avg = m._ratings.reduce((sum, r) => sum + r, 0) / m._ratings.length;
          }
          m._avgRating = avg;
          delete m._ratings;
          return m;
        });

        // 4) Trier par date DESC puis moyenne DESC
        const sorted = movies.sort((a, b) => {
          const dateA = new Date(a.release_date || a.year);
          const dateB = new Date(b.release_date || b.year);

          if (dateB - dateA !== 0) return dateB - dateA;
          return b._avgRating - a._avgRating;
        });

        // 5) Retourner les 12 premiers films
        const finalMovies = sorted.slice(0, 12).map((m) => {
          delete m._avgRating;
          return { ...m, rating: null };
        });

        res.json(finalMovies);
      })
      .on("error", (err) => {
        console.error("Erreur lecture CSV:", err);
        res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV" });
      });

  } catch (err) {
    console.error("Erreur récupération derniers films:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
