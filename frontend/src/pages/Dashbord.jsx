import React, { useEffect, useState } from "react";
import Footer from "../components/footer";
import CardRecommendation from "../components/CardRecommendation";
import Ibcf from "../components/Ibcf";
import Ubcf from "../components/ubcf";
import Infobase from "../components/Infobases";
import MainSections from "../components/MainSections";
import Welcome from "../components/Welcome";
import NotEnoughRatings from "../components/NotEnoughRatings";
import Hybride from "../components/hybride";

function Dashboard({ onLogout, user }) {
  const [favorites, setFavorites] = useState(null);
  const [ratingCount, setRatingCount] = useState(null);

  // 🔥 Charger les favoris
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("https://recommandit.onrender.com/api/user/favorites", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });
        const favData = await res.json();
        setFavorites(Array.isArray(favData) ? favData.map((f) => f.movieId) : []);
      } catch {
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, []);

  // 🔥 Charger le nombre de films notés
  useEffect(() => {
    const fetchRatingCount = async () => {
      try {
        const res = await fetch("https://recommandit.onrender.com/api/filtrage/rating-count", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });
        const data = await res.json();
        setRatingCount(data.count || 0);
      } catch {
        setRatingCount(0);
      }
    };
    fetchRatingCount();
  }, []);

  const showWelcome = favorites !== null && favorites.length === 0;
  const notEnoughRatings = ratingCount !== null && ratingCount < 11;

  return (
    <div className="border-t-2 border-black min-h-screen h-full flex flex-col bg-gradient-to-t from-stone-400 via-stone-300 to-stone-200 ">
      <div className="min-h-screen h-full">

        {/* Header */}
        <header className="flex md:flex-row flex-col justify-between min-h-screen border-b-2 border-black mt-20 md:mt-0">
          <div className="flex flex-col justify-center">
            <h1 className="md:text-9xl flex flex-row justify-center sm:text-8xl text-7xl font-bold tracking-wide font-parisienne text-outline text-black">
              Bienvenue
            </h1>
            <div className="flex flex-row justify-center font-parisienne font-semibold">
              <h1 className="text-white md:text-7xl text-5xl px-2 p-4 rounded-xl bg-black w-fit text-center">
                {user?.username || "Utilisateur"}
              </h1>
            </div>
          </div>
          <MainSections />
        </header>

        {/* 🔥 Conditions d'affichage */}
        {showWelcome ? (
  <div className="my-12">
    <Welcome />
  </div>
) : (
  <>
    {/* Toujours afficher CardRecommendation si favoris existent */}
    <div id="recommender">
    <Hybride/>
      <CardRecommendation />
      

      {/* Si pas assez de ratings → afficher NotEnoughRatings */}
      {notEnoughRatings ? (
        <NotEnoughRatings />
      ) : (
        <>
          {/* Sinon afficher UBCF + IBCF */}
          <Ubcf />
          <Ibcf />
        </>
      )}
    </div>

    <div id="infos">
      <Infobase />
    </div>
  </>
)}


        <Footer type="private" onLogout={onLogout} user={user} />
      </div>
    </div>
  );
}

export default Dashboard;
