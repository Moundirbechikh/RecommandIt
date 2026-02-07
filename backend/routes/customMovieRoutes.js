const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch"); // pour appeler ton service Python
const router = express.Router();

const MovieModel = require("../models/Movie"); // movieId, userId, createdAt
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

  // Mettre première lettre majuscule
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return ALLOWED_GENRES.includes(formatted) ? formatted : null;
}

// ✅ Fonction pour appeler ton service Python et générer description_clean
async function getDescriptionClean({ title, genres, year, actors, description }) {
  try {
    const response = await fetch("http://localhost:8000/description_clean", { // ⚠️ URL de ton service FastAPI
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

    // ✅ Trouver le plus grand movieId dans le CSV
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    let maxId = 0;

    if (fs.existsSync(filePath)) {
      const csvData = fs.readFileSync(filePath, "utf8").split("\n");
      csvData.forEach((line) => {
        const cols = line.split(",");
        const id = parseInt(cols[0]);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      });
    }

    const newMovieId = maxId + 1;

    // 1️⃣ Sauvegarde en MongoDB
    const newMovie = new MovieModel({
      movieId: newMovieId,
      userId,
      createdAt: new Date()
    });
    await newMovie.save();

    // 2️⃣ Ajouter aussi une note en MongoDB
    let rateDoc = await Rate.findOne({ userId });
    if (!rateDoc) {
      rateDoc = new Rate({ userId, ratings: [{ filmId: newMovieId, note: rating }] });
    } else {
      rateDoc.ratings.push({ filmId: newMovieId, note: rating });
    }
    await rateDoc.save();

    // 3️⃣ Normaliser les genres
    const normalizedGenres = Array.isArray(genres)
      ? genres.map((g) => normalizeGenre(g)).filter((g) => g !== null)
      : [];

    const genresString = normalizedGenres.join("|");
    const actorsString = Array.isArray(actors)
      ? `"['${actors.slice(0, 5).join("','")}']"`
      : `"${actors}"`;

    // 4️⃣ Générer description_clean via Python
    const descriptionClean = await getDescriptionClean({
      title,
      genres: normalizedGenres,
      year,
      actors,
      description
    });

    // 5️⃣ Construire la ligne CSV avec description_clean
    const line = `${newMovieId},${title},${genresString},${year},"${description}",${actorsString},${backdrop},${descriptionClean},${userId},${rating}\n`;

    fs.appendFile(filePath, line, (err) => {
      if (err) {
        console.error("❌ Erreur écriture CSV:", err);
        return res.status(500).json({ error: "Erreur CSV" });
      }
    });

    res.json({ success: true, movie: newMovie, rate: rateDoc, remaining: 2 - (count + 1) });
  } catch (err) {
    console.error("❌ Erreur ajout film:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
