import React from "react";

const MovieCard = ({ image, title, description }) => {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden w-72 md:w-96  border m-2 border-black">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-48 object-cover"
      />
      <div className="p-4 text-center">
        <h3 className="text-3xl font-parisienne font-bold text-black mb-2">{title}</h3>
        <p className="text-sm text-black font-cursive">{description}</p>
      </div>
    </div>
  );
};

export default MovieCard;
