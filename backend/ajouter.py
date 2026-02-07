import os
import pandas as pd
import requests

# ⚠️ Mets ta clé API TMDB ici
TMDB_API_KEY = "b49fefb44a18788dbe8187f4521791ea"
BASE_URL = "https://api.themoviedb.org/3"

def search_movie(title, year=None):
    """Recherche un film par titre et année optionnelle"""
    params = {
        "api_key": TMDB_API_KEY,
        "query": title,
    }
    if year and not pd.isna(year):
        try:
            params["year"] = int(float(year))
        except ValueError:
            pass
    response = requests.get(f"{BASE_URL}/search/movie", params=params)
    data = response.json()
    if data.get("results"):
        return data["results"][0]
    return None

def get_movie_details(movie_id):
    """Récupère la description, les acteurs principaux et le backdrop"""
    details = requests.get(
        f"{BASE_URL}/movie/{movie_id}",
        params={"api_key": TMDB_API_KEY, "language": "fr-FR"}
    ).json()

    credits = requests.get(
        f"{BASE_URL}/movie/{movie_id}/credits",
        params={"api_key": TMDB_API_KEY}
    ).json()

    actors = [cast["name"] for cast in credits.get("cast", [])[:5]]

    return {
        "description": details.get("overview", "Description indisponible"),
        "actors": actors,
        "backdrop": f"https://image.tmdb.org/t/p/w780{details.get('backdrop_path')}" if details.get("backdrop_path") else None
    }

def enrich_movies(csv_path):
    """Lit le CSV et enrichit chaque film avec TMDB"""
    # Vérifie que le fichier existe
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Le fichier {csv_path} est introuvable.")

    df = pd.read_csv(csv_path)

    enriched_data = []
    for _, row in df.iterrows():
        title = row["title"]
        year = row.get("year", None)

        movie = search_movie(title, year)
        if movie:
            details = get_movie_details(movie["id"])
            enriched_data.append({
                "movieId": row["movieId"],
                "title": title,
                "genres": row["genres"],
                "year": row["year"],
                "description": details["description"],
                "actors": details["actors"],
                "backdrop": details["backdrop"],
                "userId": row["userId"],
                "rating": row["rating"]
            })
        else:
            enriched_data.append({
                "movieId": row["movieId"],
                "title": title,
                "genres": row["genres"],
                "year": row["year"],
                "description": "Film introuvable sur TMDB",
                "actors": [],
                "backdrop": None,
                "userId": row["userId"],
                "rating": row["rating"]
            })

    return pd.DataFrame(enriched_data)

if __name__ == "__main__":
    # Force le dossier courant = backend
    os.chdir(os.path.dirname(__file__))

    # Ton fichier CSV est dans backend/
    csv_file = "movies_Moundir_Sami.csv"

    enriched_df = enrich_movies(csv_file)
    print(enriched_df.head())

    # Sauvegarde un nouveau CSV enrichi
    enriched_df.to_csv("movies_enriched.csv", index=False)
    print("✅ Fichier enrichi sauvegardé dans backend/movies_enriched.csv")
