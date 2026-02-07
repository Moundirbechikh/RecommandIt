const express = require("express");
const router = express.Router();
const Rate = require("../models/Rate");
const auth = require("../middlewares/auth");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// ✅ Ajouter ou mettre à jour une note
router.post("/", auth, async (req, res) => {
  try {
    const { filmId, note } = req.body;
    const userId = req.user._id;

    if (note < 0 || note > 5) {
      return res.status(400).json({ error: "La note doit être entre 0 et 5" });
    }

    let rateDoc = await Rate.findOne({ userId });

    if (!rateDoc) {
      rateDoc = new Rate({ userId, ratings: [{ filmId, note, date: new Date() }] });
    } else {
      const existing = rateDoc.ratings.find((r) => r.filmId === filmId);
      if (existing) {
        existing.note = note;
        existing.date = new Date();
      } else {
        rateDoc.ratings.push({ filmId, note, date: new Date() });
      }
    }

    await rateDoc.save();

    // ✅ Chercher les infos du film dans movies_enriched.csv
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    let movieData = null;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          if (data.movieId === filmId.toString()) {
            movieData = data;
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (movieData) {
      const title = movieData.title || "";
      const genres = movieData.genres || "";
      const year = movieData.year || "";
      const description = `"${movieData.description}"`;
      const actors = `"${movieData.actors}"`;
      const backdrop = movieData.backdrop || "";
      const description_clean = movieData.description_clean || ""; // 🔥 ajout du champ manquant

      // Respecter l’ordre des colonnes du CSV
      const line = `${movieData.movieId},${title},${genres},${year},${description},${actors},${backdrop},${description_clean},${userId},${note}\n`;

      fs.appendFile(filePath, line, (err) => {
        if (err) console.error("❌ Erreur écriture CSV:", err);
        else console.log("✅ Nouvelle ligne ajoutée dans CSV avec description_clean");
      });
    } else {
      console.warn("⚠️ Film introuvable dans CSV pour filmId:", filmId);
    }

    res.json(rateDoc);
  } catch (err) {
    console.error("Erreur ajout note:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Récupérer toutes les notes d’un utilisateur
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const rateDoc = await Rate.findOne({ userId });
    if (!rateDoc) return res.json([]);
    res.json(rateDoc.ratings);
  } catch (err) {
    console.error("Erreur fetch notes:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Récupérer les notes enrichies pour le profil
router.get("/profile", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const rateDoc = await Rate.findOne({ userId });

    if (!rateDoc) return res.json([]);

    const filePath = path.join(__dirname, "../movies_enriched.csv");
    const movies = {};

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          const id = data.movieId ? data.movieId.toString().trim() : "";
          movies[id] = data;
        })
        .on("end", () => {
          console.log("👉 Exemple clés CSV:", Object.keys(movies).slice(0, 10));
          resolve();
        })
        .on("error", reject);
    });

    const enrichedRatings = rateDoc.ratings.map((r) => {
      const key = r.filmId ? r.filmId.toString().trim() : "";
      const movie = movies[key];

      return {
        filmId: r.filmId,
        note: r.note,
        date: r.date,
        title: movie ? movie.title : "Titre inconnu",
        backdrop: movie ? movie.backdrop : null,
        genres: movie ? movie.genres : "",
        year: movie ? movie.year : "",
        description: movie ? movie.description : "",
        actors: movie ? movie.actors : "",
        description_clean: movie ? movie.description_clean : "", // 🔥 ajouté aussi ici
      };
    });

    res.json(enrichedRatings);
  } catch (err) {
    console.error("Erreur fetch notes profil:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
