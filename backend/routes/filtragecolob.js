const express = require("express");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();
const fetch = require("node-fetch");

const Movie = require("../models/Movie");
const Rate = require("../models/Rate");

router.use(authMiddleware);

// =============================
// Fonction : compter les ratings d’un user (MongoDB)
// =============================
async function getRatingCount(userId) {
  const rateDoc = await Rate.findOne({ userId }).lean();
  return rateDoc ? rateDoc.ratings.length : 0;
}

// =============================
// Fonction d’enrichissement (MongoDB)
// =============================
async function enrichRecommendations(recommendations) {
  const enriched = [];
  for (const rec of recommendations) {
    // rec peut être {title, score} ou {movieId, score}
    let movie = null;
    if (rec.title) {
      movie = await Movie.findOne({ title: rec.title }).lean();
    } else if (rec.movieId) {
      movie = await Movie.findOne({ movieId: rec.movieId }).lean();
    }

    enriched.push({
      movieId: movie ? movie.movieId : rec.movieId || null,
      title: movie ? movie.title : rec.title,
      score: rec.score,
      year: movie ? movie.year : "N/A",
      genres: movie ? movie.genres : [],
      description: movie ? movie.description : "",
      backdrop: movie ? movie.backdrop : "",
    });
  }
  return enriched;
}

// =============================
// Route API : /rating-count
// =============================
router.get("/rating-count", async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const count = await getRatingCount(userId);
    return res.json({ count });
  } catch (err) {
    console.error("❌ rating-count error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// =============================
// UBCF → Appel FastAPI + enrichissement
// =============================
router.post("/ubcf", async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const count = await getRatingCount(userId);
    console.log(`📊 UBCF: user ${userId} a ${count} films notés`);

    if (count < 4) {
      return res.json({
        success: false,
        error: "Pas assez de films notés (min 11)",
        count
      });
    }

    const { top_n = 20, k = 20 } = req.body;

    const response = await fetch("https://recommandit-1.onrender.com/ubcf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, top_n, k }),
    });

    const data = await response.json();
    const enriched = await enrichRecommendations(data.recommendations || []);

    return res.json({ success: true, recommendations: enriched });
  } catch (err) {
    console.error("❌ UBCF error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =============================
// IBCF → Appel FastAPI + enrichissement
// =============================
router.post("/ibcf", async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const count = await getRatingCount(userId);
    console.log(`📊 IBCF: user ${userId} a ${count} films notés`);

    if (count < 4) {
      return res.json({
        success: false,
        error: "Pas assez de films notés (min 11)",
        count
      });
    }

    const { top_n = 20, k = 20 } = req.body;

    const response = await fetch("https://recommandit-1.onrender.com/ibcf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, top_n, k }),
    });

    const data = await response.json();
    const enriched = await enrichRecommendations(data.recommendations || []);

    return res.json({ success: true, recommendations: enriched });
  } catch (err) {
    console.error("❌ IBCF error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
