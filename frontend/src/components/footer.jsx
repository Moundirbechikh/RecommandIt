import React from "react";
import { NavLink } from "react-router-dom";
import { FaInstagram, FaFacebookF, FaTelegramPlane } from "react-icons/fa";
import { Link } from "react-scroll";

function Footer({ type = "public", onLogout, user }) {
  const baseClass =
    "text-black p-3 rounded-lg transition hover:bg-stone-900 hover:text-white";
  const activeClass = "bg-black text-white font-bold";

  const getInitials = (FirstName, LastName) => {
    if (!FirstName && !LastName) return "";
    const f = FirstName ? FirstName.charAt(0).toUpperCase() : "";
    const l = LastName ? LastName.charAt(0).toUpperCase() : "";
    return f + l;
  };

  return (
    <footer className="backdrop-blur-xl bg-transparent text-black py-10 px-6 mt-20 w-full border-t-2 border-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Logo + Nom */}
        <div className="flex items-center gap-4">
          <img src="/favicon1.ico" alt="Logo" className="w-10 h-10 rounded-md" />
          <span className="text-2xl font-bold font-parisienne">Recommande It</span>
        </div>

        {/* Liens */}
        <div className="flex flex-wrap gap-6 text-base font-cursive">
          {type === "public" ? (
            <>
              {/* Accueil = route */}
              <NavLink to="/" className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}>
                Accueil
              </NavLink>

              {/* À propos = ancre interne */}
              <Link
                to="apropos"
                smooth={true}
                duration={600}
                className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
              >
                À propos
              </Link>

              {/* Connexion = route */}
              <NavLink
                to="/connexion"
                className={({ isActive }) =>
                  isActive
                    ? "hover:text-white hover:bg-black p-1 px-2 rounded-md bg-black text-white font-parisienne font-bold"
                    : "hover:text-white hover:bg-black p-1 px-2 rounded-md bg-white text-black font-parisienne font-bold"
                }
              >
                Connexion
              </NavLink>
            </>
          ) : (
            <>
              {/* Recommander = ancre interne */}
              <Link
                to="recommender"
                smooth={true}
                duration={600}
                className="text-black p-1 mt-2 font-medium rounded-md hover:bg-black hover:text-white cursor-pointer"
              >
                Films à recommander
              </Link>

              {/* Infos = ancre interne */}
              <Link
                to="infos"
                smooth={true}
                duration={600}
                className="text-black p-1 mt-2 font-medium rounded-md hover:bg-black hover:text-white cursor-pointer"
              >
                Infos
              </Link>

              {/* Films = route */}
              <NavLink to="/films" className={({ isActive }) => (isActive ? `${baseClass} ${activeClass}` : baseClass)}>
                Films
              </NavLink>

              {/* Déconnexion */}
              <button
                onClick={onLogout}
                className="hover:text-white hover:bg-black p-1 px-2 rounded-md bg-black text-white font-parisienne font-bold"
              >
                Déconnexion
              </button>

              {/* Bulle initiales */}
              <div className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-bold">
                {getInitials(user?.FirstName,user?.LastName)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Us + Réseaux sociaux */}
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold mb-4 font-parisienne">Contact Us</h3>
        <div className="flex justify-center gap-6">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:scale-110 transition-transform">
            <FaInstagram size={24} />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:scale-110 transition-transform">
            <FaFacebookF size={24} />
          </a>
          <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:scale-110 transition-transform">
            <FaTelegramPlane size={24} />
          </a>
        </div>
      </div>

      {/* Citation + Mention légale */}
      <div className="mt-6 text-center text-base text-black font-cursive">
        <p className="italic mb-2">
          « Le cinéma, c’est l’écriture moderne dont l’encre est la lumière. »
        </p>
        <p className="text-xs text-gray-700">
          © {new Date().getFullYear()} Recommande It. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
