// models/Rate.js
const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ratings: [
    {
      filmId: { type: String, required: true },
      note: { type: Number, min: 0, max: 5, required: true }, // ✅ note sur 5
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Rate", rateSchema);
