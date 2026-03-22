const Favorite = require("../models/Favorite");
const Movie = require("../models/Movie");

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
 * Récupérer les favoris de l’utilisateur connecté (films enrichis depuis MongoDB)
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.sub;

    if (!userId) {
      return res.status(400).json({ message: "userId manquant" });
    }

    const favorites = await Favorite.find({ userId }).lean();

    // Charger les films depuis MongoDB
    const favoriteMovies = await Promise.all(
      favorites.map(async (fav) => {
        const movie = await Movie.findOne({ movieId: fav.movieId }).lean();
        return movie || null;
      })
    );

    res.json(favoriteMovies.filter(Boolean));
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
