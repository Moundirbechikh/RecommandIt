// models/Favorite.js
const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movieId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
