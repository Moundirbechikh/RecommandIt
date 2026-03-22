const express = require("express");
const router = express.Router();
const Rate = require("../models/Rate");
const Movie = require("../models/Movie");
const auth = require("../middlewares/auth");

// ✅ Ajouter ou mettre à jour une note
router.post("/", auth, async (req, res) => {
  try {
    const { filmId, note } = req.body;
    const userId = req.user._id;

    // Vérification de la valeur
    const allowedNotes = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    if (!allowedNotes.includes(note)) {
      return res.status(400).json({ error: "La note doit être 0, 0.5, 1, 1.5, ..., 4.5 ou 5" });
    }

    // Attente de 1 seconde avant sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    const rateDoc = await Rate.findOne({ userId }).lean();

    if (!rateDoc) return res.json([]);

    const enrichedRatings = await Promise.all(
      rateDoc.ratings.map(async (r) => {
        const movie = await Movie.findOne({ movieId: r.filmId }).lean();

        return {
          filmId: r.filmId,
          note: r.note,
          date: r.date,
          title: movie ? movie.title : "Titre inconnu",
          backdrop: movie ? movie.backdrop : null,
          genres: movie ? movie.genres : [],
          year: movie ? movie.year : "",
          description: movie ? movie.description : "",
          actors: movie ? movie.actors : [],
          description_clean: movie ? movie.description_clean : "",
        };
      })
    );

    res.json(enrichedRatings);
  } catch (err) {
    console.error("Erreur fetch notes profil:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
