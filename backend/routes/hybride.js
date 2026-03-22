const express = require("express");
const fetch = require("node-fetch");
const authMiddleware = require("../middlewares/auth");
const Favorite = require("../models/Favorite");
const Rate = require("../models/Rate");
const Movie = require("../models/Movie");

const router = express.Router();
router.use(authMiddleware);

// =============================
// Fonction d’enrichissement robuste (MongoDB)
// =============================
async function enrichRecommendations(recommendations) {
  const enriched = [];
  for (const rec of recommendations) {
    let movieInfo = null;

    // Cas 1 : FastAPI renvoie déjà un objet complet
    if (rec.movieId && rec.title) {
      enriched.push(rec);
      continue;
    }

    // Cas 2 : FastAPI renvoie {title, score}
    if (rec.title) {
      movieInfo = await Movie.findOne({ title: rec.title }).lean();
    }

    // Cas 3 : FastAPI renvoie {movieId, score}
    if (!movieInfo && rec.movieId) {
      movieInfo = await Movie.findOne({ movieId: rec.movieId }).lean();
    }

    // Cas 4 : FastAPI renvoie un tuple [id, score]
    if (!movieInfo && Array.isArray(rec) && rec.length === 2) {
      const [film, score] = rec;
      movieInfo = await Movie.findOne({ movieId: film }).lean() || await Movie.findOne({ title: film }).lean();
      if (movieInfo) {
        enriched.push({ ...movieInfo, score });
        continue;
      }
    }

    if (movieInfo) {
      enriched.push({ ...movieInfo, score: rec.score });
    }
  }
  return enriched.filter(Boolean);
}

// =============================
// Route principale : recommandations hybrides
// =============================
router.post("/", async (req, res) => {
  try {
    const userObjectId = req.user.sub;
    console.log("\n====================== HYBRIDE DEBUG ======================");
    console.log("📩 Requête reçue pour userId:", userObjectId);

    if (!userObjectId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // 1️⃣ Récupérer les favoris depuis MongoDB et convertir en titres
    const favoritesDocs = await Favorite.find({ userId: userObjectId }).lean();
    const favoriteTitles = [];
    for (const f of favoritesDocs) {
      const movie = await Movie.findOne({ movieId: f.movieId }).lean();
      if (movie) favoriteTitles.push(movie.title);
    }

    // 2️⃣ Récupérer les notes depuis MongoDB et convertir en titres
    const rateDoc = await Rate.findOne({ userId: userObjectId }).lean();
    const userRatings = [];
    for (const r of (rateDoc?.ratings || [])) {
      const movie = await Movie.findOne({ movieId: r.filmId }).lean();
      if (movie) {
        userRatings.push({ title: movie.title, rating: r.note || r.rating });
      }
    }

    // 3️⃣ Construire le payload pour FastAPI
    const params = {
      userId: userObjectId,
      top_n: req.body.top_n || 100,
      k: req.body.k || 41,
      favorites: favoriteTitles,
      userRatings,
    };
    console.log("📡 Appel FastAPI /hybrid avec paramètres:", params);

    // 4️⃣ Appeler FastAPI /hybrid
    const response = await fetch("https://recommandit-1.onrender.com/hybrid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ FastAPI error:", text);
      return res.status(500).json({ error: "Erreur FastAPI", details: text });
    }

    const data = await response.json();
    const recs = data.recommendations || [];
    console.log("🎯 Nombre de recommandations hybrides reçues:", recs.length);
    console.log("📌 Premières recommandations:", recs.slice(0, 3));

    // 5️⃣ Enrichir les résultats si besoin
    const enriched = await enrichRecommendations(recs);

    res.json({ success: true, recommendations: enriched });
    console.log("====================== HYBRIDE END ======================\n");
  } catch (err) {
    console.error("❌ Erreur route hybride:", err);
    res.status(500).json({ error: "Erreur serveur Hybride", details: err.message });
  }
});

module.exports = router;
