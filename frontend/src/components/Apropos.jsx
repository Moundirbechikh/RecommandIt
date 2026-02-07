import React from "react";
import { FaUsers, FaTags, FaDatabase, FaFilm } from "react-icons/fa";

function Apropos() {
  return (
    <section className="max-w-5xl px-9 py-10 mx-auto text-center">

      {/* Intro */}
      <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
        Bienvenue sur <span className="font-bold">Recommend It</span>, 
        un site pensé pour tous ceux qui aiment découvrir de nouveaux films 
        sans contraintes et sans inscription. Ici, pas besoin de créer un compte 
        ou de partager vos données personnelles : vous arrivez, vous explorez, 
        et vous repartez avec des idées de films à regarder.
      </p>

      {/* Section explicative */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Carte 1 */}
        <div className="bg-stone-300 backdrop-blur-md shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105">
          <FaUsers className="text-4xl text-gray-700 mb-4" />
          <h3 className="text-xl text-black font-bold mb-2 font-parisienne">Filtrage Collaboratif</h3>
          <p className="text-gray-700">
            Nous analysons les préférences des autres utilisateurs pour vous proposer des films similaires.
          </p>
        </div>

        {/* Carte 2 */}
        <div className="bg-transparent backdrop-blur-md shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105">
          <FaTags className="text-4xl text-gray-700 mb-4 " />
          <h3 className="text-xl font-bold mb-2 font-parisienne">Filtrage par Catégorie</h3>
          <p className="text-gray-700">
            Explorez vos genres favoris grâce à un système de filtrage par valeur et catégorie.
          </p>
        </div>

        {/* Carte 3 */}
        <div className="bg-transparent backdrop-blur-md shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105">
          <FaDatabase className="text-4xl text-gray-700 mb-4 " />
          <h3 className="text-xl font-bold mb-2 font-parisienne">Base de Données Évolutive</h3>
          <p className="text-gray-700">
            Notre catalogue s'enrichit continuellement grâce aux recommandations des nouveaux utilisateurs.
          </p>
        </div>

        {/* Carte 4 */}
        <div className="bg-stone-300 backdrop-blur-md shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105">
          <FaFilm className="text-4xl text-gray-700 mb-4" />
          <h3 className="text-black text-xl font-bold mb-2 font-parisienne">Nouveaux Films</h3>
          <p className="text-gray-700">
            Chaque visite vous permet de découvrir de nouveaux films ajoutés régulièrement.
          </p>
        </div>
      </div>

      {/* Conclusion */}
      <p className="text-lg md:text-xl text-gray-700 leading-relaxed mt-12">
        Notre objectif est de rendre la découverte de films <span className="font-bold">simple, ludique et inspirante</span>. 
        Que vous soyez cinéphile ou juste en quête d’un bon film pour ce soir, 
        <span className="font-parisienne"> Recommend It </span> est là pour vous guider.
      </p>
    </section>
  );
}

export default Apropos;
