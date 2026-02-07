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
        <div className="flex flex-row mt-28 justify-center">
          <h1 className="md:text-9xl text-6xl font-bold tracking-wide font-parisienne text-outline">
            Recommend
            <span className="text-black bg-white px-3 rounded-lg ml-3">It</span>
          </h1>
        </div>

        {/* PAGE FIRST */}
        <First />
      </div>
    </>
  );
}

export default Firstpage;
