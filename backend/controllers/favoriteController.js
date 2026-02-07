// controllers/favoriteController.js
const Favorite = require("../models/Favorite");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

/**
 * Ajouter un favori
 * Body attendu : { movieId: "123" }
 */
exports.addFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.sub; // ou req.user.userId

    if (!movieId || !userId) {
      return res.status(400).json({ message: "movieId ou userId manquant" });
    }

    const exists = await Favorite.findOne({ userId, movieId });
    if (exists) {
      return res.status(400).json({ message: "Film déjà en favoris" });
    }

    const favorite = new Favorite({ userId, movieId });
    await favorite.save();

    res.status(201).json({ message: "Favori ajouté", favorite });
  } catch (err) {
    console.error("❌ Erreur ajout favori:", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * Récupérer les favoris de l’utilisateur connecté (films enrichis)
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.sub;

    if (!userId) {
      return res.status(400).json({ message: "userId manquant" });
    }

    const favorites = await Favorite.find({ userId });

    // Charger les films depuis CSV
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    const moviesMap = new Map();

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          moviesMap.set(data.movieId, {
            movieId: data.movieId,
            title: data.title,
            year: data.year,
            genres: data.genres ? data.genres.split("|") : [],
            description: data.description,
            backdrop: data.backdrop,
            release_date: data.release_date,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const favoriteMovies = favorites
      .map((fav) => moviesMap.get(fav.movieId))
      .filter(Boolean);

    res.json(favoriteMovies);
  } catch (err) {
    console.error("❌ Erreur récupération favoris:", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

/**
 * Supprimer un favori
 */
exports.removeFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.sub;

    if (!movieId || !userId) {
      return res.status(400).json({ message: "movieId ou userId manquant" });
    }

    const deleted = await Favorite.findOneAndDelete({ userId, movieId });

    if (!deleted) {
      return res.status(404).json({ message: "Favori introuvable" });
    }

    res.json({ message: "Favori supprimé" });
  } catch (err) {
    console.error("❌ Erreur suppression favori:", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
