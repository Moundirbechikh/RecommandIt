require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Import des modèles
const Movie = require("./models/Movie");
const Rate = require("./models/Rate");

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


const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// Middlewares globaux
// =======================
app.use(cors());
app.use(express.json()); // pour lire le JSON dans les requêtes


app.get('/keep-alive', (req, res) => {
  console.log("Ping reçu ! Le serveur reste éveillé.");
  res.status(200).send('Instance active');
});
// =======================
// Endpoint pour récupérer tous les films depuis MongoDB
// =======================
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().lean();
    res.json(movies);
  } catch (err) {
    console.error("❌ Erreur récupération films:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des films" });
  }
});

// =======================
// Endpoint pour les films tendances (les plus récents et mieux notés)
// =======================
app.get("/api/movies/latest", async (req, res) => {
  try {
    const movies = await Movie.find().lean();

    const moviesWithRatings = await Promise.all(
      movies.map(async (movie) => {
        const rates = await Rate.find({ "ratings.filmId": String(movie.movieId) }).lean();

        let allRatings = [];
        rates.forEach(r => {
          r.ratings.forEach(rt => {
            if (rt.filmId === String(movie.movieId)) {
              allRatings.push(rt.note);
            }
          });
        });

        const avgRating = allRatings.length > 0
          ? allRatings.reduce((sum, n) => sum + n, 0) / allRatings.length
          : 0;

        return { ...movie, avgRating };
      })
    );

    const sorted = moviesWithRatings.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      if (yearB !== yearA) return yearB - yearA;
      return b.avgRating - a.avgRating;
    });

    const finalMovies = sorted.slice(0, 12).map(m => ({
      ...m,
      rating: m.avgRating
    }));

    res.json(finalMovies);
  } catch (err) {
    console.error("❌ Erreur films tendances:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des films tendances" });
  }
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
// Connexion MongoDB Atlas + lancement serveur
// =======================
console.log("🔎 Valeur de process.env.MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, { dbName: "RecommendIT" })
  .then(async () => {
    console.log("✅ Connecté à MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`✅ Backend démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion MongoDB:", err.message);
    process.exit(1);
  });
