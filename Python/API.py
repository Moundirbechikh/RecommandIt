from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import List
import pandas as pd
import requests
import io
import os
import asyncio

from algo1 import build_description_clean_one
from ubcf import recommender_ubcf_direct
from ibcf import recommender_ibcf_from_ratings
from cb import ContentBasedRecommender

# =========================
# Initialiser FastAPI
# =========================
app = FastAPI()

# =========================
# NOUVEAU : Route de Santé (Health Check)
# Indispensable pour que Render sache que l'app est réveillée
# =========================
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "message": "RecommendIT FastAPI is awake",
        "csv_loaded": not df_init.empty if 'df_init' in globals() else False
    }

# =========================
# Schémas
# =========================
class Movie(BaseModel):
    title: str
    genres: List[str]
    year: str
    actors: List[str]
    description: str

class UserRequest(BaseModel):
    userId: str
    top_n: int = 10
    k: int = 20

class RatingsEntry(BaseModel):
    title: str
    rating: float

class UserRatingsRequest(BaseModel):
    userId: str
    top_n: int = 10
    k: int = 20
    userRatings: List[RatingsEntry]

class FavoritesRequest(BaseModel):
    favorites: List[str]
    top_n: int = 20
    exclude_seen: List[str] = []

class HybridRequest(BaseModel):
    userId: str
    top_n: int = 20
    k: int = 20
    favorites: List[str] = []
    userRatings: List[RatingsEntry] = []

# =========================
# Utilitaire : Chargement CSV amélioré
# =========================
def load_csv():
    """Charge le CSV avec un timeout plus long et une gestion d'erreur robuste."""
    try:
        # On tente de joindre le backend Node
        backend_url = "https://recommandit.onrender.com/api/csv/movies"
        
        # Augmentation du timeout à 30 secondes pour le réveil Render
        response = requests.get(backend_url, timeout=30)
        response.raise_for_status()

        df = pd.read_csv(
            io.StringIO(response.text),
            encoding="utf-8",
            sep=",",
            quotechar='"',
            escapechar="\\",
            engine="python",
            on_bad_lines="skip"
        )

        # Nettoyage standard
        df.columns = df.columns.str.strip()
        df.columns = df.columns.str.replace("\ufeff", "", regex=False)

        if "userId" in df.columns:
            df["userId"] = df["userId"].astype(str)

        if "description_clean" not in df.columns:
            df["description_clean"] = df.get("description", "placeholder description").fillna("placeholder description")
        
        return df

    except Exception as e:
        print(f"⚠️ Erreur chargement CSV: {e}")
        # Si ça échoue, on essaie de charger le fichier temporaire local s'il existe
        if os.path.exists("movies_temp.csv"):
            return pd.read_csv("movies_temp.csv")
        
        return pd.DataFrame()

# Chargement initial au démarrage
df_init = load_csv()
if not df_init.empty:
    df_init.to_csv("movies_temp.csv", index=False)

# Initialisation du recommender avec le fichier local
cb_reco = ContentBasedRecommender(csv_path="movies_temp.csv")

# =========================
# DESCRIPTION CLEAN
# =========================
@app.post("/description_clean")
async def description_clean(
    title: str = Body(...), 
    genres: List[str] = Body(...), 
    year: str = Body(...), 
    actors: List[str] = Body(...), 
    description: str = Body(...)
):
    try:
        desc_clean = build_description_clean_one(
            title=title, genres=genres, year=year, actors=actors, description=description
        )
        return {"success": True, "description_clean": desc_clean}
    except Exception as e:
        return {"success": False, "error": str(e)}

# =========================
# HYBRID (Endpoint Principal)
# =========================
@app.post("/hybrid")
async def hybrid_recommend_api(req: HybridRequest):
    # On recharge pour avoir les dernières données (favoris/notes récents)
    df = load_csv()
    
    if df.empty:
        return {"success": False, "recommendations": [], "error": "Base de données indisponible"}

    try:
        # 1. Calcul des recos par les différents algos
        ubcf_recs = recommender_ubcf_direct(df=df, user_object_id=req.userId, top_n=100, k=req.k)
        
        user_ratings_list = [{"title": r.title, "rating": r.rating} for r in req.userRatings]
        ibcf_recs = recommender_ibcf_from_ratings(df=df, user_ratings=user_ratings_list, top_n=100, k=req.k)
        
        content_recs = cb_reco.recommend_from_titles(
            favorites=req.favorites, 
            top_n=100, 
            exclude_seen=[r.title for r in req.userRatings]
        )

        # 2. Normalisation et Hybridation
        ibcf_norm = {film: score / 5.0 for film, score in ibcf_recs}
        ubcf_norm = {film: score / 5.0 for film, score in ubcf_recs}
        content_norm = {film: 1.0 for film in content_recs}

        alpha, beta = 0.75, 0.5
        candidate_films = set(ibcf_norm) | set(ubcf_norm) | set(content_norm)

        cf_scores = {
            film: beta * ubcf_norm.get(film, 0.0) + (1.0 - beta) * ibcf_norm.get(film, 0.0)
            for film in candidate_films
        }
        hybrid_scores = {
            film: alpha * content_norm.get(film, 0.0) + (1.0 - alpha) * cf_scores.get(film, 0.0)
            for film in candidate_films
        }

        # 3. Filtrage des films déjà vus
        seen_titles = {r.title for r in req.userRatings}
        seen_ids = set(df[df["title"].isin(seen_titles)]["movieId"].astype(str).tolist())

        recs = [
            (film, score) for film, score in hybrid_scores.items()
            if film not in seen_titles and str(film) not in seen_ids
        ]

        recs = sorted(recs, key=lambda x: x[1], reverse=True)[:req.top_n]

        # 4. Enrichissement des résultats
        enriched = []
        for film, score in recs:
            row = df[df["movieId"].astype(str) == str(film)].head(1).to_dict(orient="records")
            if row:
                enriched.append({
                    "movieId": row[0]["movieId"],
                    "title": row[0]["title"],
                    "year": row[0].get("year", ""),
                    "genres": row[0].get("genres", "").split("|") if isinstance(row[0].get("genres"), str) else [],
                    "description": row[0].get("description", ""),
                    "backdrop": row[0].get("backdrop", ""),
                    "score": round(float(score), 4)
                })

        return {"success": True, "recommendations": enriched}

    except Exception as e:
        print(f"❌ Erreur lors du calcul hybride: {e}")
        return {"success": False, "error": str(e)}
