import React from "react";
import { NavLink } from "react-router-dom";
import { FaFilm } from "react-icons/fa";

const GlassWelcome = () => {
  return (
    <div className="w-11/12 mx-auto mt-20 p-12 rounded-3xl 
                    bg-white/10 backdrop-blur-xl border border-white/20 
                    shadow-2xl text-center text-white">
      <h2 className="text-7xl font-bold mb-6 tracking-wide font-parisienne flex items-center justify-center gap-3">
        <FaFilm className="p-3 bg-white rounded-md text-black" /> 
        Plongez dans l’univers <span className="">du</span> cinéma
      </h2>
      <p className="text-2xl leading-relaxed mb-8 font-cursive text-black px-20">
  Chaque film que vous aimez révèle vos goûts uniques.  
  Pour des recommandations <span className="font-bold">plus précises et adaptées</span>, 
  choisissez au moins <span className="font-bold">3 films favoris</span> et notez ceux que vous avez déjà regardés ou les plus récents.  
  Plus vous participez, plus notre système affine vos suggestions.  
  <br />
  <span className="font-bold">Astuce :</span> vous pouvez aussi proposer de nouveaux films via notre formulaire dédié, 
  afin d’enrichir la base et améliorer vos recommandations.
</p>

      <NavLink
        to="/films"
        className="inline-block px-8 py-4 rounded-2xl 
                   bg-white/20 hover:bg-white/30 
                   transition-all duration-500 ease-in-out 
                   transform hover:scale-105 hover:shadow-lg 
                   font-parisienne text-2xl text-black"
      >
        🎬 Explorer les Films
      </NavLink>
    </div>
  );
};

export default GlassWelcome;
