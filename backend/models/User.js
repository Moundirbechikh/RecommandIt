const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: Number, unique: true, required: true },
    username: { type: String, required: true, trim: true },
    FirstName: { type: String, required: true, trim: true },
    LastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    country: { type: String, default: "Unknown" },
    status: { 
      type: String, 
      enum: ["etudiant", "professionnel", "autre"], 
      default: "autre" 
    }
  },
  { timestamps: true }
);

// Hash du mot de passe avant sauvegarde
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode de comparaison du mot de passe
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
