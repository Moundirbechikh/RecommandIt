import React from "react";
import { NavLink } from "react-router-dom";
import { FaFilm } from "react-icons/fa";

const NotEnoughRatings = () => {
  return (
<div className="w-11/12 mx-auto mt-10 sm:mt-20 p-6 sm:p-12 rounded-3xl 
                bg-white/10 backdrop-blur-xl border border-white/20 
                shadow-2xl text-center text-white">
  <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-wide font-parisienne 
                 flex flex-col sm:flex-row items-center justify-center gap-3">
    <FaFilm className="p-2 sm:p-3 bg-white rounded-md text-black" /> 
    Continuez votre aventure cinéma
  </h2>

  <p className="text-base sm:text-lg md:text-2xl leading-relaxed mb-8 font-cursive text-black px-4 sm:px-10 md:px-20">
    Pour débloquer les recommandations avancées basées sur vos goûts,
    vous devez noter au moins <span className="font-bold">5 films</span>.
    <br /><br />
    Pour le moment, nous vous proposons des suggestions basées sur 
    <span className="font-bold"> vos favoris</span> et vos interactions.
    <br />
    Plus vous notez de films, plus nos recommandations deviennent 
    <span className="font-bold"> précises et personnalisées</span>.
  </p>

  <NavLink
    to="/films"
    className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-2xl 
               bg-white/20 hover:bg-white/30 
               transition-all duration-500 ease-in-out 
               transform hover:scale-105 hover:shadow-lg 
               font-parisienne text-lg sm:text-2xl text-black"
  >
    🎬 Noter des Films
  </NavLink>
</div>

  );
};

export default NotEnoughRatings;
