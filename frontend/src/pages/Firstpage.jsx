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
        <div className="flex flex-col sm:flex-row mt-16 sm:mt-28 justify-center items-center px-2 font-parisienne font-bold">
  <h1 className="text-6xl sm:text-6xl md:text-9xl  tracking-wide  text-outline text-center">
    Recommend
  </h1>
  <span className="text-6xl sm:text-6xl md:text-9xl text-black bg-white px-2 py-3 sm:px-3 rounded-lg mt-2 sm:mt-0 sm:ml-3">
    It
  </span>
</div>


        {/* PAGE FIRST */}
        <First />
      </div>
    </>
  );
}

export default Firstpage;
