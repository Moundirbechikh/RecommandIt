const express = require("express");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// Si votre environnement Node n'a pas fetch global, décommentez et installez node-fetch
// const fetch = require("node-fetch");

router.use(authMiddleware);

// =============================
// Charger le CSV UNE SEULE FOIS (pour enrichissement côté Express)
// =============================
let moviesMap = new Map();

function loadMovies() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "../movies_enriched.csv");

    if (!fs.existsSync(filePath)) {
      console.error("❌ CSV introuvable :", filePath);
      return reject("CSV not found");
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        moviesMap.set(row.title, {
          movieId: row.movieId || null,
          title: row.title || "",
          year: row.year || "",
          genres: row.genres ? row.genres.split("|") : [],
          description: row.description || "",
          backdrop: row.backdrop || "",
        });
      })
      .on("end", () => {
        console.log("✅ CSV chargé :", moviesMap.size, "films");
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ Erreur lecture CSV:", err);
        reject(err);
      });
  });
}

loadMovies().catch((err) => {
  console.error("❌ loadMovies initial failed:", err);
});

// =============================
// Fonction : compter les ratings d’un user
// =============================
function getRatingCount(userId) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "../movies_enriched.csv");
    let count = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.userId && row.userId.toString().trim() === userId.toString().trim()) {
          count++;
        }
      })
      .on("end", () => resolve(count))
      .on("error", reject);
  });
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
// Fonction d’enrichissement
// =============================
function enrichRecommendations(recommendations) {
  return recommendations.map((rec) => {
    const info = moviesMap.get(rec.title) || {};
    return {
      movieId: info.movieId || null,
      title: rec.title,
      score: rec.score,
      year: info.year || "N/A",
      genres: info.genres || [],
      description: info.description || "",
      backdrop: info.backdrop || "",
    };
  });
}

// =============================
// UBCF → Appel FastAPI + enrichissement
// =============================
router.post("/ubcf", async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    // 🔥 Vérifier nombre de notes
    const count = await getRatingCount(userId);
    console.log(`📊 UBCF: user ${userId} a ${count} films notés`);

    if (count < 11) {
      return res.json({
        success: false,
        error: "Pas assez de films notés (min 11)",
        count
      });
    }

    const { top_n = 20, k = 20 } = req.body;

    const response = await fetch("http://localhost:8000/ubcf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, top_n, k }),
    });

    const data = await response.json();
    const enriched = enrichRecommendations(data.recommendations || []);

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

    // 🔥 Vérifier nombre de notes
    const count = await getRatingCount(userId);
    console.log(`📊 IBCF: user ${userId} a ${count} films notés`);

    if (count < 11) {
      return res.json({
        success: false,
        error: "Pas assez de films notés (min 11)",
        count
      });
    }

    const { top_n = 20, k = 20 } = req.body;

    const response = await fetch("http://localhost:8000/ibcf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, top_n, k }),
    });

    const text = await response.text();
    const data = JSON.parse(text);

    const enriched = enrichRecommendations(data.recommendations || []);

    return res.json({ success: true, recommendations: enriched });

  } catch (err) {
    console.error("❌ IBCF error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
