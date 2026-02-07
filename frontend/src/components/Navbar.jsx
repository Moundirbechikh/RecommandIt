import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Link } from "react-scroll";

function Navbar({ isAuthenticated, onLogout, user }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const baseClass =
    "text-black p-1 font-medium rounded-md transition hover:bg-white hover:text-black";
  const activeClass = "bg-black text-white font-bold";

  // Fonction pour générer les initiales à partir de prénom + nom
  const getInitials = (FirstName, LastName) => {
    if (!FirstName && !LastName) return "";
    const f = FirstName ? FirstName.charAt(0).toUpperCase() : "";
    const l = LastName ? LastName.charAt(0).toUpperCase() : "";
    return f + l;
  };

  const isConnexionPage = location.pathname === "/connexion";
  const isFilmsPage = location.pathname === "/films";
  const isProfilePage = location.pathname === "/profile";
  const isFavoritePage = location.pathname === "/films/favoris";
  const isSecPage = location.pathname === "/films/tendances";
  const isNotePage = location.pathname === "/films/recents";
  return (
    <header className="backdrop-blur-3xl shadow-md flex flex-row w-fit rounded-b-2xl fixed z-50 border-b-2 border-x-2 border-black">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Menu desktop */}
        <nav className="space-x-6 hidden md:flex font-cursive">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${baseClass} ${activeClass}` : baseClass
            }
          >
            Accueil
          </NavLink>

          {isAuthenticated ? (
            <>
              {/* Profile page: only Accueil, Profil, Déconnexion */}
              {isProfilePage ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Profil
                  </NavLink>
                </>
              ) :(isFilmsPage || isFavoritePage || isSecPage || isNotePage) ?(
                // Films page: Accueil, Favoris, Films, Déconnexion
                <>
                  <NavLink
                    to="/films/favoris"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Mes films favoris
                  </NavLink>
                  <NavLink
                    to="/films"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Films
                  </NavLink>
                </>
              ) : (
                // Dashboard/base: full set including anchors
                <>
                  <NavLink
                    to="/films/favoris"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Mes films favoris
                  </NavLink>

                  {/* Anchors (react-scroll) visible uniquement en base/dashboard */}
                  <Link
                    to="recommender"
                    smooth={true}
                    duration={600}
                    className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
                  >
                    Films à recommender
                  </Link>
                  <Link
                    to="infos"
                    smooth={true}
                    duration={600}
                    className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
                  >
                    Infos
                  </Link>

                  <NavLink
                    to="/films"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Films
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Profil
                  </NavLink>
                </>
              )}

              <button
                onClick={onLogout}
                className="text-xl p-1 font-extrabold font-parisienne rounded-md bg-black text-white hover:bg-white hover:text-black"
              >
                Déconnexion
              </button>

              <div className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-bold">
              {getInitials(user?.FirstName, user?.LastName)}
              </div>
            </>
          ) : (
            <>
              {/* Non authentifié */}
              {!isConnexionPage && (
                <>
                  <NavLink
                    to="/connexion"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Rechercher
                  </NavLink>
                  <Link
                    to="apropos"
                    smooth={true}
                    duration={600}
                    className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
                  >
                    À propos
                  </Link>
                </>
              )}
              <NavLink
                to="/connexion"
                className={({ isActive }) =>
                  isActive
                    ? "text-xl p-1 font-extrabold font-parisienne rounded-md bg-black text-white"
                    : "text-xl p-1 font-extrabold font-parisienne rounded-md bg-white text-black hover:bg-black hover:text-white"
                }
              >
                Connexion
              </NavLink>
            </>
          )}
        </nav>

        {/* Icône mobile */}
        <button
          className="md:hidden text-gray-700 hover:text-white"
          onClick={() => setOpen(!open)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="flex flex-col space-y-4 p-4 md:hidden font-cursive bg-white rounded-lg shadow-lg">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${baseClass} ${activeClass}` : baseClass
            }
          >
            Accueil
          </NavLink>

          {isAuthenticated ? (
            <>
              {isProfilePage ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Profil
                  </NavLink>
                </>
              ) :(isFilmsPage || isFavoritePage || isSecPage || isNotePage) ? (
                <>
                  <NavLink
                    to="/films/favoris"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Mes films favoris
                  </NavLink>
                  <NavLink
                    to="/films"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Films
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/films/favoris"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Mes films favoris
                  </NavLink>

                  <Link
                    to="recommender"
                    smooth={true}
                    duration={600}
                    className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
                  >
                    Films à recommender
                  </Link>
                  <Link
                    to="infos"
                    smooth={true}
                    duration={600}
                    className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
                  >
                    Infos
                  </Link>

                  <NavLink
                    to="/films"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Films
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Profil
                  </NavLink>
                </>
              )}

              <button
                onClick={onLogout}
                className="text-xl p-1 font-extrabold font-parisienne rounded-md bg-black text-white hover:bg-white hover:text-black"
              >
                Déconnexion
              </button>

              <div className="mt-2 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white font-bold">
                {getInitials(user?.FirstName, user?.LastName)}
              </div>
            </>
          ) : (
            <>
              {!isConnexionPage && (
                <>
                  <NavLink
                    to="/connexion"
                    className={({ isActive }) =>
                      isActive ? `${baseClass} ${activeClass}` : baseClass
                    }
                  >
                    Rechercher
                  </NavLink>
                  <Link
                    to="apropos"
                    smooth={true}
                    duration={600}
                    className="text-black p-1 font-medium rounded-md hover:bg-white hover:text-black cursor-pointer"
                  >
                    À propos
                  </Link>
                </>
              )}
              <NavLink
                to="/connexion"
                className={({ isActive }) =>
                  isActive
                    ? "text-xl p-1 font-extrabold font-parisienne rounded-md bg-black text-white"
                    : "text-xl p-1 font-extrabold font-parisienne rounded-md bg-white text-black hover:bg-black hover:text-white"
                }
              >
                Connexion
              </NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
