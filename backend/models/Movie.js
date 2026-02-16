// models/Movie.js
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  movieId: { type: Number, required: true }, // identifiant interne
  title: { type: String, required: true },
  genres: { type: [String], default: [] },
  year: { type: String },
  description: { type: String },
  actors: { type: [String], default: [] },
  backdrop: { type: String },
  description_clean: { type: String },
  userId: { type: String, required: true }, // qui a ajouté le film
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Movie", movieSchema);
