import React from "react";
import First from "./First";


function Firstpage() {
  return (
    <>
      {/* SECTION AVEC IMAGE FIXE ET DÉGRADÉ */}
      <div
        className="min-h-screen w-full bg-cover bg-center bg-fixed text-white flex flex-col border-black border-t-2"
        style={{ backgroundImage: "url('/back.png')" }}
      >
        {/* NAVBAR */}
        <div className="flex flex-row justify-center">

        </div>

        {/* TITRE RecommendIt */}
<div className="flex flex-row mt-16 sm:mt-28 justify-center px-2">
  <h1 className="text-5xl sm:text-6xl md:text-9xl font-bold tracking-wide font-parisienne text-outline text-center">
    Recommend
    <span className="text-black bg-white px-2 sm:px-3 rounded-lg ml-2 sm:ml-3">
      It
    </span>
  </h1>
</div>


        {/* PAGE FIRST */}
        <First />
      </div>
    </>
  );
}

export default Firstpage;
