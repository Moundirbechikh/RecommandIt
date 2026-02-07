const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const CounterSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  value: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", CounterSchema);

// Lire le CSV pour trouver le max userId
async function getMaxUserIdFromCSV() {
  return new Promise((resolve) => {
    const csvPath = process.env.CSV_USERS_PATH
      ? path.resolve(process.env.CSV_USERS_PATH)
      : null;

    if (!csvPath || !fs.existsSync(csvPath)) {
      return resolve(0);
    }

    let maxId = 0;
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        const id = parseInt(row.userId || row.user_id || row.id);
        if (!isNaN(id) && id > maxId) maxId = id;
      })
      .on("end", () => resolve(maxId))
      .on("error", () => resolve(0));
  });
}

// Initialiser le compteur au démarrage
async function initUserIdCounter() {
  const counterName = "userId";
  let counter = await Counter.findOne({ name: counterName });
  if (!counter) {
    const maxCSV = await getMaxUserIdFromCSV();
    counter = await Counter.create({ name: counterName, value: maxCSV });
    console.log(`🔢 Compteur userId initialisé à partir du CSV: ${maxCSV}`);
  } else {
    console.log(`🔢 Compteur userId existant: ${counter.value}`);
  }
}

// Obtenir le prochain userId atomiquement
async function getNextUserId() {
  const counterName = "userId";
  const updated = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return updated.value;
}

module.exports = { initUserIdCounter, getNextUserId };
