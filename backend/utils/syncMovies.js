const fs = require("fs");
const path = require("path");
const Rate = require("../models/Rate");
const MovieModel = require("../models/Movie");

async function syncMovies() {
  try {
    const pastPath = path.join(__dirname, "../movies_enriched.csv");
    const enrichedPath = path.join(__dirname, "../movies_enriched_new.csv");

    if (fs.existsSync(pastPath)) {
      fs.copyFileSync(pastPath, enrichedPath);
      console.log("✅ Copie exacte de movies_past.csv vers movies_enriched_new.csv");
    } else {
      console.error("❌ movies_past.csv introuvable");
      return;
    }

    const pastLines = fs.readFileSync(pastPath, "utf8").split("\n");
    const moviesMap = {};
    for (const line of pastLines) {
      const movieId = line.split(",")[0];
      if (movieId) {
        moviesMap[movieId] = line;
      }
    }

    const rates = await Rate.find({});

    for (const rateDoc of rates) {
      const uniqueRatings = {};
      for (const r of rateDoc.ratings) {
        uniqueRatings[r.filmId] = r;
      }

      for (const filmId of Object.keys(uniqueRatings)) {
        const r = uniqueRatings[filmId];
        const originalLine = moviesMap[filmId];

        if (originalLine) {
          // ✅ Retirer les deux dernières colonnes et ajouter userId + rating
          const parts = originalLine.split(",");
          const base = parts.slice(0, -2).join(","); // tout sauf les 2 dernières
          const newLine = `${base},${rateDoc.userId},${r.note}\n`;

          fs.appendFileSync(enrichedPath, newLine);
          console.log(`✅ Ajouté note ${r.note} pour filmId ${filmId}`);
        } else {
          const movieDoc = await MovieModel.findOne({ movieId: parseInt(filmId) });
          if (!movieDoc) continue;

          const genresString = movieDoc.genres ? movieDoc.genres.join("|") : "";
          const actorsString = movieDoc.actors ? `"['${movieDoc.actors.join("','")}']"` : "";

          const newLine = `${movieDoc.movieId},${movieDoc.title},${genresString},${movieDoc.year},"${movieDoc.description}",${actorsString},${movieDoc.backdrop || ""},${movieDoc.description_clean || ""},${rateDoc.userId},${r.note}\n`;

          fs.appendFileSync(enrichedPath, newLine);
          console.log(`✅ Ajouté film custom ${movieDoc.title} avec note ${r.note}`);
        }
      }
    }

    console.log("🎬 Synchronisation terminée !");
  } catch (err) {
    console.error("❌ Erreur sync:", err);
  }
}

module.exports = syncMovies;
