require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const cors = require("cors");
const mongoose = require("mongoose");

// Import des routes
const authRoutes = require("./routes/auth"); // routes d’authentification
const favoriteRoutes = require("./routes/favoriteRoutes"); // routes favoris

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// Middlewares globaux
// =======================
app.use(cors());
app.use(express.json()); // pour lire le JSON dans les requêtes

// =======================
// Endpoint pour récupérer les films uniques depuis CSV
// =======================
app.get("/api/movies", (req, res) => {
  const moviesMap = new Map();
  const filePath = path.join(__dirname, "movies_enriched.csv");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier movies_enriched.csv introuvable" });
  }

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      const movieId = data.movieId;

      // Normaliser genres en tableau
      let genres = [];
      if (data.genres && typeof data.genres === "string") {
        genres = data.genres.split("|");
      }

      // Si le film existe déjà, on ne l’ajoute pas une deuxième fois
      if (!moviesMap.has(movieId)) {
        moviesMap.set(movieId, {
          movieId: data.movieId,
          title: data.title,
          year: data.year,
          genres: genres,
          description: data.description,
          actors: data.actors ? data.actors.split(",") : [],
          backdrop: data.backdrop,
        });
      }
    })
    .on("end", () => {
      // Convertir la Map en tableau
      const uniqueMovies = Array.from(moviesMap.values());
      res.json(uniqueMovies);
    })
    .on("error", (err) => {
      console.error("Erreur lecture CSV:", err);
      res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV" });
    });
});

const rateRoutes = require("./routes/rateRoutes");
app.use("/api/rates", rateRoutes);

const contentBasedRoutes = require("./routes/contentBasedRoutes");
app.use("/api/recommendations/content-based", contentBasedRoutes);

const latestRoutes = require("./routes/latest");
app.use("/api/movies/latestAdd", latestRoutes);


const tmdbRoutes = require("./routes/tmdbRoutes");
app.use("/api/tmdb", tmdbRoutes);

const customMovieRoutes = require("./routes/customMovieRoutes");
app.use("/api/movies", customMovieRoutes);

const filtragecolobRoutes = require("./routes/filtragecolob");
app.use("/api/filtrage", filtragecolobRoutes);

const hybrideRoutes = require("./routes/hybride");
app.use("/api/hybride", hybrideRoutes);

// =======================
// Endpoint pour les films tendances
// =======================
app.get("/api/movies/latest", (req, res) => {
  const moviesMap = new Map();
  const filePath = path.join(__dirname, "movies_enriched.csv");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier movies_enriched.csv introuvable" });
  }

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      const movieId = data.movieId;

      if (!moviesMap.has(movieId)) {
        moviesMap.set(movieId, {
          movieId: data.movieId,
          title: data.title,
          year: data.year,
          release_date: data.release_date,
          genres: data.genres ? data.genres.split("|") : [],
          description: data.description,
          backdrop: data.backdrop,
          ratingsCount: 0,
          _ratings: [] // stockage temporaire des notes
        });
      }

      const movie = moviesMap.get(movieId);

      // Incrémenter le compteur de notes
      movie.ratingsCount += 1;

      // Ajouter la note si elle existe
      if (data.rating && !isNaN(data.rating)) {
        movie._ratings.push(parseFloat(data.rating));
      }
    })
    .on("end", () => {
      // Calculer la moyenne des notes pour le tri uniquement
      const movies = Array.from(moviesMap.values()).map((m) => {
        let avg = 0;
        if (m._ratings.length > 0) {
          avg = m._ratings.reduce((sum, r) => sum + r, 0) / m._ratings.length;
        }
        m._avgRating = avg; // champ interne pour le tri
        delete m._ratings;
        return m;
      });

      // ✅ Trier par date DESC puis par moyenne de notes DESC
      const sorted = movies.sort((a, b) => {
        const dateA = new Date(a.release_date || a.year);
        const dateB = new Date(b.release_date || b.year);

        if (dateB - dateA !== 0) {
          return dateB - dateA; // plus récent d’abord
        }
        return b._avgRating - a._avgRating; // ensuite meilleur score
      });

      // ✅ Supprimer le champ interne avant envoi
      const finalMovies = sorted.slice(0, 12).map((m) => {
        delete m._avgRating;
        return { ...m, rating: null }; // rating toujours null dans la réponse
      });

      res.json(finalMovies);
    })
    .on("error", (err) => {
      console.error("Erreur lecture CSV:", err);
      res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV" });
    });
});

// =======================
// Routes d’authentification
// =======================
app.use("/api/auth", authRoutes);

// =======================
// Routes favoris (protégées par JWT)
// =======================
app.use("/api/user/favorites", favoriteRoutes);

// =======================
// Connexion MongoDB Atlas
// =======================
console.log("🔎 Valeur de process.env.MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, { dbName: "RecommendIT" })
  .then(() => {
    console.log("✅ Connecté à MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // ⚠️ FAILLE : si tu vois ETIMEOUT ici, ce n’est pas ton code mais ta connexion réseau/DNS.
    // - Ton PC n’arrive pas à résoudre moundir.ijlyjtb.mongodb.net (problème DNS ou firewall).
    // - Vérifie que ton IP est bien whitelistée dans Atlas (Network Access).
    // - Essaie de changer ton DNS (8.8.8.8 / 1.1.1.1) ou teste sur une autre connexion.
    // - Teste aussi ton URI avec MongoDB Compass pour confirmer qu’il est valide.
    console.error("❌ Erreur de connexion MongoDB:", err.message);
    process.exit(1);
  });
