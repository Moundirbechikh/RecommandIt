const express = require("express");
const fetch = require("node-fetch"); // ✅ fonctionne avec node-fetch@2
const fs = require("fs");
const path = require("path");
const router = express.Router();

const TMDB_KEY = process.env.TMDB_KEY;

// ✅ Recherche de films avec filtrage CSV
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Query manquante" });

  try {
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    let existingTitles = new Set();

    if (fs.existsSync(filePath)) {
      const csvData = fs.readFileSync(filePath, "utf8").split("\n");
      csvData.forEach((line) => {
        const cols = line.split(",");
        const title = cols[1]?.trim().toLowerCase();
        if (title) {
          const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          existingTitles.add(normalized);
        }
      });
    }

    // ✅ Appel à TMDB en anglais
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      return res.status(500).json({ error: "Réponse invalide de TMDB" });
    }

    const filteredResults = data.results.filter((movie) => {
      const normalizedTitle = movie.title
        ?.trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return !existingTitles.has(normalizedTitle);
    });

    res.json({ results: filteredResults });
  } catch (err) {
    console.error("Erreur TMDB:", err);
    res.status(500).json({ error: "Erreur lors de l’appel à TMDB" });
  }
});

// ✅ Détails d’un film + acteurs principaux (titre anglais + description française)
router.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Détails en anglais
    const urlEN = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&append_to_response=credits&language=en-US`;
    const responseEN = await fetch(urlEN);
    const dataEN = await responseEN.json();

    if (!dataEN || dataEN.success === false) {
      return res.status(404).json({ error: "Film introuvable" });
    }

    // 2️⃣ Détails en français (pour la description)
    const urlFR = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=fr-FR`;
    const responseFR = await fetch(urlFR);
    const dataFR = await responseFR.json();

    // ✅ Extraire les 5 acteurs principaux
    const actors = dataEN.credits?.cast?.slice(0, 5).map((a) => a.name) || [];

    res.json({
      ...dataEN,
      overview: dataFR.overview || dataEN.overview, // description en français
      actors,
    });
  } catch (err) {
    console.error("Erreur TMDB details:", err);
    res.status(500).json({ error: "Erreur lors de l’appel à TMDB details" });
  }
});

module.exports = router;
