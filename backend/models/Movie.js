const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  movieId: {
    type: Number, // identifiant interne (ex: 1889)
    required: true,
  },
  userId: {
    type: String, // id utilisateur (JWT ou Mongo)
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // trace de la date d’ajout
  },
});

module.exports = mongoose.model("Movie", movieSchema);
