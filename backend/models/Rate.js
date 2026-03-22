const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // ⚡️ maintenant une string
  ratings: [
    {
      filmId: { type: String, required: true },
      note: { type: Number, min: 0, max: 5, required: true }, // ✅ note sur 5
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Rate", rateSchema);
