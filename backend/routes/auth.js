const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getNextUserId } = require("../utils/idCounter");
const requireAuth = require("../middlewares/auth");

const router = express.Router();

// Générer un JWT
function signToken(user) {
  console.log("🧪 JWT_SECRET existe ?", !!process.env.JWT_SECRET);

  const token = jwt.sign(
    {
      sub: user._id,
      userId: user.userId,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return token;
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, FirstName, LastName, email, password, country, status } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email et password sont requis" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email déjà utilisé" });

    const userId = await getNextUserId();

const user = await User.create({
  userId,
  username,
  email,
  LastName,
  FirstName,
  password,
  country: country || "Unknown",
  status: status || "active",
});
    const token = signToken(user);

    console.log("🟢 Token généré REGISTER:", token);

    res.status(201).json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        LastName: user.LastName,
        FirstName: user.FirstName,
        country: user.country,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📥 Login request:", { email });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Identifiants invalides" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

    const token = signToken(user);

    console.log("🟢 Token généré LOGIN:", token);

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        LastName: user.LastName,
        FirstName: user.FirstName,
        country: user.country,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Profil (lecture)
router.get("/me", requireAuth, async (req, res) => {
  try {
    console.log("👤 /me appelé avec user:", req.user);

    const user = await User.findOne({ userId: req.user.userId }).lean();
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    res.json({ user });
  } catch (err) {
    console.error("Me error:", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Modifier le profil
router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { FirstName, LastName, country, status, username, password } = req.body;

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    if (FirstName !== undefined) user.FirstName = FirstName;
    if (LastName !== undefined) user.LastName = LastName;
    if (country !== undefined) user.country = country;
    if (status !== undefined) user.status = status;
    if (username !== undefined) user.username = username;

    if (password !== undefined && password.trim() !== "") {
      user.password = password;
    }

    await user.save();

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        FirstName: user.FirstName,
        LastName: user.LastName,
        country: user.country,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
