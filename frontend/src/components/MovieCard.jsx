import React from "react";

const MovieCard = ({ image, title, description }) => {
  return (
<div className="bg-white bg-opacity-10 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden 
                w-full max-w-xs sm:max-w-sm md:max-w-md border m-2 border-black">
  <img 
    src={image} 
    alt={title} 
    className="w-full h-40 sm:h-48 object-cover"
  />
  <div className="p-3 sm:p-4 text-center">
    <h3 className="text-xl sm:text-2xl md:text-3xl font-parisienne font-bold text-black mb-2">
      {title}
    </h3>
    <p className="text-xs sm:text-sm md:text-base text-black font-cursive">
      {description}
    </p>
  </div>
</div>

  );
};

export default MovieCard;
