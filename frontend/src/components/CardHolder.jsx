import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import actionImage from '../assets/Action.png';
import horrorImage from '../assets/horror.png';
import comedieImage from '../assets/comedie.png';
import sciImage from '../assets/sci.png';
import drameImage from '../assets/drame.png';
import { NavLink } from "react-router-dom";

const movies = [
  {
    id: 1,
    image: actionImage,
    title: 'Action',
    description: 'Des films explosifs remplis d\'aventure'
  },
  {
    id: 2,
    image: sciImage,
    title: 'Science-Fiction',
    description: 'Voyages futuristes et mondes inconnus.'
  },
  {
    id: 3,
    image: comedieImage,
    title: 'Comédie',
    description: 'Des films drôles pour passer un bon moment.'
  },
  {
    id: 4,
    image: horrorImage,
    title: 'Horreur',
    description: 'Des frissons et des histoires effrayantes.'
  },
  {
    id: 5,
    image: drameImage,
    title: 'Drame',
    description: 'Des récits profonds et émotionnels.'
  }
];

const CardHolder = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % movies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const getPosition = (i) => {
    if (i === index) return 'center';
    if (i === (index - 1 + movies.length) % movies.length) return 'left';
    if (i === (index + 1) % movies.length) return 'right';
    return 'hidden';
  };

  return (
    <section className="flex flex-col items-center pt-20 pb-5 gap-10 w-full">
<div
        className={`relative w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl h-72 flex justify-center items-end transition-all duration-700 ease-out transform ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
        }`}
      >
        {movies.map((movie, i) => {
          const position = getPosition(i);
          return (
      <div
  className={`absolute transition-all duration-700 cursor-pointer ${
    position === 'center'
      ? 'scale-100 z-10 opacity-100'
      : position === 'left'
      ? 'translate-x-[-80px] sm:translate-x-[-120px] md:translate-x-[-150px] scale-75 sm:scale-90 opacity-40 sm:opacity-50 z-0'
      : position === 'right'
      ? 'translate-x-[80px] sm:translate-x-[120px] md:translate-x-[150px] scale-75 sm:scale-90 opacity-40 sm:opacity-50 z-0'
      : 'opacity-0 pointer-events-none'
  }`}
  onClick={() => setIndex(i)}
>
  <MovieCard
    image={movie.image}
    title={movie.title}
    description={movie.description}
  />
</div>
          );
        })}
      </div>
      <div className="text-center px-4 border-t-2 border-black w-full">
        <h2 className="text-3xl md:text-4xl font-parisienne text-black mb-1 mt-10">
          Découvrez nos catégories de films
        </h2>
        <p className=" text-gray-700 text-lg font-cursive">
          Il existe une multitude d'autres genres et films à explorer. Cliquez pour en découvrir plus.
        </p>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 ">
      <NavLink
        to="/connexion"
        className="px-9 py-3 rounded-xl text-xl font-bold font-parisienne bg-white text-black hover:bg-black hover:text-white transition-transform hover:scale-105"
      >
        Connexion
      </NavLink>

      {/* Bouton À propos → scroll vers l’ancre */}
      <a
        href="/#apropos"
        className="px-9 py-3 rounded-xl text-xl font-medium font-cursive bg-black text-white hover:bg-white hover:text-black transition-transform hover:scale-105"
      >
        À propos
      </a>
      </div>
    </section>
  );
};

export default CardHolder;
