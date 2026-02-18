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
const rateRoutes = require("./routes/rateRoutes");
const contentBasedRoutes = require("./routes/contentBasedRoutes");
const latestRoutes = require("./routes/latest");
const tmdbRoutes = require("./routes/tmdbRoutes");
const customMovieRoutes = require("./routes/customMovieRoutes");
const filtragecolobRoutes = require("./routes/filtragecolob");
const hybrideRoutes = require("./routes/hybride");

// Import de la fonction de synchronisation
const syncMovies = require("./utils/syncMovies");

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

      let genres = [];
      if (data.genres && typeof data.genres === "string") {
        genres = data.genres.split("|");
      }

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
      const uniqueMovies = Array.from(moviesMap.values());
      res.json(uniqueMovies);
    })
    .on("error", (err) => {
      console.error("Erreur lecture CSV:", err);
      res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV" });
    });
});

// =======================
// Routes principales
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/user/favorites", favoriteRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/recommendations/content-based", contentBasedRoutes);
app.use("/api/movies/latestAdd", latestRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/movies", customMovieRoutes);
app.use("/api/filtrage", filtragecolobRoutes);
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
          _ratings: []
        });
      }

      const movie = moviesMap.get(movieId);
      movie.ratingsCount += 1;

      if (data.rating && !isNaN(data.rating)) {
        movie._ratings.push(parseFloat(data.rating));
      }
    })
    .on("end", () => {
      const movies = Array.from(moviesMap.values()).map((m) => {
        let avg = 0;
        if (m._ratings.length > 0) {
          avg = m._ratings.reduce((sum, r) => sum + r, 0) / m._ratings.length;
        }
        m._avgRating = avg;
        delete m._ratings;
        return m;
      });

      const sorted = movies.sort((a, b) => {
        const dateA = new Date(a.release_date || a.year);
        const dateB = new Date(b.release_date || b.year);

        if (dateB - dateA !== 0) {
          return dateB - dateA;
        }
        return b._avgRating - a._avgRating;
      });

      const finalMovies = sorted.slice(0, 12).map((m) => {
        delete m._avgRating;
        return { ...m, rating: null };
      });

      res.json(finalMovies);
    })
    .on("error", (err) => {
      console.error("Erreur lecture CSV:", err);
      res.status(500).json({ error: "Erreur lors de la lecture du fichier CSV" });
    });
});

// =======================
// Nouvelle route pour exposer movies_enriched_new.csv
// =======================
app.get("/api/csv/movies", (req, res) => {
  const filePath = path.join(__dirname, "movies_enriched.csv");
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("CSV introuvable");
  }
  res.sendFile(filePath);
});

// =======================
// Connexion MongoDB Atlas + lancement serveur
// =======================
console.log("🔎 Valeur de process.env.MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, { dbName: "RecommendIT" })
  .then(async () => {
    console.log("✅ Connecté à MongoDB Atlas");

    try {
      await syncMovies();
      console.log("🎬 Synchronisation des films terminée au démarrage");
    } catch (err) {
      console.error("⚠️ Erreur lors de la synchronisation:", err);
    }

    app.listen(PORT, () => {
      console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion MongoDB:", err.message);
    process.exit(1);
  });
