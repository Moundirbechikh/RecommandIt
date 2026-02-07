import React, { useState } from "react";
import Login from "../components/Login";
import Register from "../components/Register";

function Connexion({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <section className="flex justify-center items-center h-screen w-full bg-gradient-to-br from-stone-200 via-white border-t-2 border-b-2 border-black to-stone-400 backdrop-blur-xl overflow-x-hidden">
      <div className="bg-white/30 shadow-2xl rounded-2xl p-8 w-full max-w-sm">
        
        {/* Affichage conditionnel */}
        {isLogin ? <Login onLogin={onLogin} /> : <Register />}

        {/* Switch entre Login et Register */}
        <div className="text-center mt-6">
          {isLogin ? (
            <p className="text-gray-700 font-cursive text-sm">
              Pas encore inscrit ?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-black font-bold hover:text-white hover:bg-black px-2 py-1 rounded-lg transition text-sm"
              >
                Créez un compte
              </button>
            </p>
          ) : (
            <p className="text-gray-700 font-cursive text-sm">
              Déjà inscrit ?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-black font-bold hover:text-white hover:bg-black px-2 py-1 rounded-lg transition text-sm"
              >
                Connectez-vous
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Connexion;
