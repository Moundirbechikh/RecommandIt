const express = require("express");
const fetch = require("node-fetch");
const authMiddleware = require("../middlewares/auth");
const Favorite = require("../models/Favorite");
const Rate = require("../models/Rate");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();
router.use(authMiddleware);

// Charger le CSV en mémoire pour convertir movieId → infos
let moviesMap = new Map();
function loadMovies() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const movieData = {
          movieId: row.movieId,
          title: row.title,
          year: row.year,
          genres: row.genres ? row.genres.split("|") : [],
          description: row.description,
          backdrop: row.backdrop,
        };
        // Stocker par id et par titre
        moviesMap.set(String(row.movieId), movieData);
        moviesMap.set(row.title, movieData);
      })
      .on("end", () => resolve())
      .on("error", reject);
  });
}
loadMovies().catch(console.error);

// Fonction d’enrichissement robuste
function enrichRecommendations(recommendations) {
  return recommendations
    .map((rec) => {
      let movieInfo = null;

      // Cas 1 : FastAPI renvoie déjà un objet complet
      if (rec.movieId && rec.title) {
        return rec;
      }

      // Cas 2 : FastAPI renvoie {title, score}
      if (rec.title) {
        movieInfo = moviesMap.get(rec.title);
      }

      // Cas 3 : FastAPI renvoie {movieId, score}
      if (!movieInfo && rec.movieId) {
        movieInfo = moviesMap.get(String(rec.movieId));
      }

      // Cas 4 : FastAPI renvoie un tuple [id, score]
      if (!movieInfo && Array.isArray(rec) && rec.length === 2) {
        const [film, score] = rec;
        movieInfo = moviesMap.get(String(film)) || moviesMap.get(film);
        return movieInfo ? { ...movieInfo, score } : null;
      }

      return movieInfo ? { ...movieInfo, score: rec.score } : null;
    })
    .filter(Boolean);
}

// =============================
// Route principale : recommandations hybrides
// =============================
router.post("/", async (req, res) => {
  try {
    const userObjectId = req.user.sub;
    console.log(
      "\n====================== HYBRIDE DEBUG ======================"
    );
    console.log("📩 Requête reçue pour userId:", userObjectId);

    if (!userObjectId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // 1️⃣ Récupérer les favoris depuis MongoDB et convertir en titres
    const favoritesDocs = await Favorite.find({ userId: userObjectId }).lean();
    const favoriteTitles = favoritesDocs
      .map((f) => {
        const movie = moviesMap.get(String(f.movieId));
        return movie ? movie.title : null;
      })
      .filter(Boolean);

    // 2️⃣ Récupérer les notes depuis MongoDB et convertir en titres
    const rateDoc = await Rate.findOne({ userId: userObjectId }).lean();
    const userRatings = (rateDoc?.ratings || [])
      .map((r) => {
        const movie = moviesMap.get(String(r.filmId));
        return movie
          ? { title: movie.title, rating: r.note || r.rating }
          : null;
      })
      .filter(Boolean);

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
    const enriched = enrichRecommendations(recs);

    res.json({ success: true, recommendations: enriched });
    console.log("====================== HYBRIDE END ======================\n");
  } catch (err) {
    console.error("❌ Erreur route hybride:", err);
    res
      .status(500)
      .json({ error: "Erreur serveur Hybride", details: err.message });
  }
});

module.exports = router;
