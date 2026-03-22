// https://recommandit-1.onrender.com
const express = require("express");
const fetch = require("node-fetch");
const Favorite = require("../models/Favorite");
const Rate = require("../models/Rate");
const Movie = require("../models/Movie");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();
router.use(authMiddleware);

// =============================
// Route principale : recommandations content-based
// =============================
router.post("/", async (req, res) => {
  try {
    const userObjectId = req.user.sub;
    if (!userObjectId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // 1️⃣ Récupérer les favoris depuis MongoDB
    const favoritesDocs = await Favorite.find({ userId: userObjectId }).lean();
    if (!favoritesDocs || favoritesDocs.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    // 2️⃣ Construire la liste des titres favoris depuis Movie
    const favoriteTitles = [];
    for (const f of favoritesDocs) {
      const movie = await Movie.findOne({ movieId: f.movieId }).lean();
      if (movie) favoriteTitles.push(movie.title);
    }

    if (favoriteTitles.length === 0) {
      return res.status(400).json({ error: "Aucun titre trouvé pour les favoris de l'utilisateur" });
    }

    // 3️⃣ Récupérer les notes de l'utilisateur
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

    // 4️⃣ Appeler FastAPI /cb
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

    // 5️⃣ Enrichir les résultats depuis MongoDB
    const recommendedMovies = await Promise.all(
      movieIds.map(async (id) => {
        const m = await Movie.findOne({ movieId: id }).lean();
        if (!m) return null;
        const userRating = userRatingsMap.has(String(id)) ? userRatingsMap.get(String(id)) : null;
        return { ...m, userRating, rated: userRating !== null };
      })
    );

    res.json({ success: true, recommendations: recommendedMovies.filter(Boolean) });
  } catch (err) {
    console.error("Erreur route content-based:", err);
    res.status(500).json({ error: "Erreur serveur CB", details: err.message });
  }
});

module.exports = router;
