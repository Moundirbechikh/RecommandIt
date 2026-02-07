import React from "react";

function MovieRateCard({ title, backdrop, note, date }) {
  // ✅ Calculer la date relative
  const getRelativeDate = (d) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date)) return ""; // si date invalide
  
    const now = new Date();
    // Normaliser à minuit pour comparer uniquement les jours
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
    const diff = Math.floor((today - target) / (1000 * 60 * 60 * 24));
  
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return `Il y a ${diff} jours`;
  };

  return (
    <div className="bg-white/40 shadow-lg rounded-xl overflow-hidden flex flex-col w-64">
      {/* Image backdrop */}
      {backdrop && (
        <img
          src={backdrop}
          alt={title}
          className="w-full h-36 object-cover"
        />
      )}

      {/* Infos */}
      <div className="p-4 flex flex-col gap-2 text-center">
        <h3 className="text-lg font-bold text-black font-cursive">{title}</h3>
        <p className="text-yellow-600 font-semibold">⭐ {note}/5</p>
        <p className="text-gray-600 text-sm">{getRelativeDate(date)}</p>
      </div>
    </div>
  );
}

export default MovieRateCard;
