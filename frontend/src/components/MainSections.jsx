import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FilmSection from "./FilmSection";

function MainSections() {
  const navigate = useNavigate();

  const [favoris, setFavoris] = useState([]);
  const [tendances, setTendances] = useState([]);
  const [recents, setRecents] = useState([]);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    // ✅ Charger favoris
    fetch("https://recommandit.onrender.com/api/user/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFavoris(data);
      })
      .catch((err) => console.error("Erreur fetch favoris:", err));

    // ✅ Charger tendances
    fetch("https://recommandit.onrender.com/api/movies/latest")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTendances(data);
      })
      .catch((err) => console.error("Erreur fetch tendances:", err));

    // ✅ Charger récemment notés
    fetch("https://recommandit.onrender.com/api/movies/latestAdd", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecents(data);
      })
      .catch((err) => console.error("Erreur fetch recents:", err));
  }, []);

  // ✅ Sections dynamiques
  const sections = [
    { id: "favoris", title: "Mes Favoris", movies: favoris, link: "/films/favoris" },
    { id: "tendances", title: "Tendances", movies: tendances, link: "/films/tendances" },
    { id: "recents", title: "Récemment Ajoutée", movies: recents, link: "/films/recents" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % sections.length);
        setVisible(true);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, [sections.length]);

  const currentSection = sections[index];

  return (
    <main className="flex-1 p-8 flex justify-center items-center">
      <div
        className={`transition-all duration-1000 ease-in-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-110"
        }`}
      >
        <FilmSection
          title={currentSection.title}
          movies={currentSection.movies}
          link={currentSection.link}
          onSeeAll={() => navigate(currentSection.link)}
        />
      </div>
    </main>
  );
}

export default MainSections;
