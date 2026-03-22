const express = require("express");
const fetch = require("node-fetch"); // pour appeler ton service Python
const router = express.Router();

const MovieModel = require("../models/Movie"); // modèle complet du film
const Rate = require("../models/Rate");        // modèle des notes
const requireAuth = require("../middlewares/auth"); // middleware JWT

// Liste des genres autorisés
const ALLOWED_GENRES = [
  "Animation", "Drama", "Mystery", "Sci-Fi", "Thriller", "Adventure", "Children",
  "Comedy", "Fantasy", "Romance", "Action", "Horror", "Crime", "Film-Noir",
  "War", "Musical", "Western", "Documentary", "History"
];

// Fonction de normalisation
function normalizeGenre(name) {
  if (!name) return null;
  const lower = name.toLowerCase();

  if (lower.includes("science fiction")) return "Sci-Fi";
  if (lower.includes("sci-fi")) return "Sci-Fi";
  if (lower.includes("family") || lower.includes("children")) return "Children";
  if (lower.includes("film-noir")) return "Film-Noir";
  if (lower.includes("music") || lower.includes("musical")) return "Musical";
  if (lower.includes("documentary")) return "Documentary";
  if (lower.includes("history")) return "History";

  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return ALLOWED_GENRES.includes(formatted) ? formatted : null;
}

// ✅ Fonction pour appeler ton service Python et générer description_clean
async function getDescriptionClean({ title, genres, year, actors, description }) {
  try {
    const response = await fetch("https://recommandit-1.onrender.com/description_clean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, genres, year, actors, description }),
    });
    const data = await response.json();
    return data.description_clean || "";
  } catch (err) {
    console.error("❌ Erreur appel service Python:", err);
    return "";
  }
}

// ✅ Compter combien de films un utilisateur a ajouté cette semaine
router.get("/count", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const count = await MovieModel.countDocuments({
      userId,
      createdAt: { $gte: oneWeekAgo }
    });

    res.json({ count });
  } catch (err) {
    console.error("❌ Erreur route /count:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Ajouter un film personnalisé (sans CSV)
router.post("/custom", requireAuth, async (req, res) => {
  console.log("➡️ Route /api/movies/custom atteinte");

  try {
    const { title, year, description, backdrop, rating, genres, actors } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // ✅ Vérifier limite de 2 films par semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const count = await MovieModel.countDocuments({
      userId,
      createdAt: { $gte: oneWeekAgo }
    });

    if (count >= 2) {
      return res.status(403).json({ success: false, error: "limit" });
    }

    // ✅ Trouver le plus grand movieId dans MongoDB
    const lastMovie = await MovieModel.findOne().sort({ movieId: -1 }).lean();
    const maxId = lastMovie ? lastMovie.movieId : 0;
    const newMovieId = maxId + 1;

    // ✅ Normaliser genres et acteurs
    const normalizedGenres = Array.isArray(genres)
      ? genres.map((g) => normalizeGenre(g)).filter((g) => g !== null)
      : [];
    const actorsArray = Array.isArray(actors) ? actors.slice(0, 5) : [];

    // ✅ Générer description_clean via Python
    const descriptionClean = await getDescriptionClean({
      title,
      genres: normalizedGenres,
      year,
      actors: actorsArray,
      description
    });

    if (!descriptionClean) {
      return res.status(400).json({ error: "Impossible de générer description_clean" });
    }

    // ✅ Sauvegarde complète en MongoDB (Movie)
    const newMovie = new MovieModel({
      movieId: newMovieId,
      title,
      genres: normalizedGenres,
      year,
      description,
      actors: actorsArray,
      backdrop,
      description_clean: descriptionClean,
      userId
    });
    await newMovie.save();

    // ✅ Ajouter la note en MongoDB (Rate)
    let rateDoc = await Rate.findOne({ userId });
    if (!rateDoc) {
      rateDoc = new Rate({ userId, ratings: [{ filmId: newMovieId, note: rating }] });
    } else {
      const existing = rateDoc.ratings.find((r) => r.filmId === newMovieId.toString());
      if (existing) {
        existing.note = rating;
        existing.date = new Date();
      } else {
        rateDoc.ratings.push({ filmId: newMovieId, note: rating });
      }
    }
    await rateDoc.save();

    res.json({ success: true, movie: newMovie, rate: rateDoc, remaining: 2 - (count + 1) });
  } catch (err) {
    console.error("❌ Erreur ajout film:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
