// routes/favoriteRoutes.js
const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const authMiddleware = require("../middlewares/auth");

// Toutes les routes nécessitent un utilisateur connecté
router.post("/", authMiddleware, favoriteController.addFavorite);
router.get("/", authMiddleware, favoriteController.getFavorites);
router.delete("/:movieId", authMiddleware, favoriteController.removeFavorite);

module.exports = router;
