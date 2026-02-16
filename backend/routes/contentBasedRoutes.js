// routes/contentBasedRoutes.js
const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Favorite = require("../models/Favorite");
const Rate = require("../models/Rate");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();
router.use(authMiddleware);

// Fonction pour charger le CSV à chaque requête
async function loadMoviesMap() {
  return new Promise((resolve, reject) => {
    const moviesMap = new Map();
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        moviesMap.set(String(data.movieId), {
          movieId: data.movieId,
          title: data.title,
          year: data.year,
          genres: data.genres ? data.genres.split("|") : [],
          description: data.description,
          backdrop: data.backdrop,
        });
      })
      .on("end", () => resolve(moviesMap))
      .on("error", reject);
  });
}

// Route principale : recommandations content-based
router.post("/", async (req, res) => {
  try {
    const userObjectId = req.user.sub;
    if (!userObjectId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // 1) Récupérer les favoris depuis MongoDB
    const favoritesDocs = await Favorite.find({ userId: userObjectId }).lean();
    if (!favoritesDocs || favoritesDocs.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    // 2) Charger la map des films (CSV rechargé à chaque requête)
    const moviesMap = await loadMoviesMap();

    // 3) Construire la liste des titres favoris
    const favoriteTitles = favoritesDocs
      .map((f) => {
        const movie = moviesMap.get(String(f.movieId));
        return movie ? movie.title : null;
      })
      .filter(Boolean);

    if (favoriteTitles.length === 0) {
      return res.status(400).json({ error: "Aucun titre trouvé pour les favoris de l'utilisateur" });
    }

    // 4) Récupérer les notes de l'utilisateur
    const rateDoc = await Rate.findOne({ userId: userObjectId }).lean();
    const excludeSeenSet = new Set();
    const userRatingsMap = new Map();

    if (rateDoc && Array.isArray(rateDoc.ratings)) {
      for (const r of rateDoc.ratings) {
        if (r && r.filmId !== undefined && r.filmId !== null) {
          const mid = String(r.filmId);
          excludeSeenSet.add(mid);
          const noteValue = r.note !== undefined ? r.note : (r.rating !== undefined ? r.rating : null);
          if (noteValue !== null) userRatingsMap.set(mid, noteValue);
        }
      }
    }

    const excludeSeen = Array.from(excludeSeenSet);

    // 5) Appeler FastAPI /cb
    const response = await fetch("https://recommandit-1.onrender.com/cb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        favorites: favoriteTitles,
        top_n: req.body.top_n || 20,
        exclude_seen: excludeSeen,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("FastAPI error:", text);
      return res.status(500).json({ error: "Erreur FastAPI", details: text });
    }

    const data = await response.json();
    if (!data.success) {
      return res.status(500).json({ error: "FastAPI CB error", details: data.error });
    }

    const movieIds = data.recommendations;

    // 6) Enrichir les résultats
    const recommendedMovies = movieIds
      .map((id) => {
        const m = moviesMap.get(String(id));
        if (!m) return null;
        const userRating = userRatingsMap.has(String(id)) ? userRatingsMap.get(String(id)) : null;
        return { ...m, userRating, rated: userRating !== null };
      })
      .filter(Boolean);

    res.json({ success: true, recommendations: recommendedMovies });
  } catch (err) {
    console.error("Erreur route content-based:", err);
    res.status(500).json({ error: "Erreur serveur CB", details: err.message });
  }
});

module.exports = router;
