const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      ...payload,
      _id: payload.sub || payload._id || payload.id,
      userId: payload.userId || null,
    };
    next();
  } catch (err) {
    console.error("❌ Erreur JWT:", err.message);
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

module.exports = requireAuth;
