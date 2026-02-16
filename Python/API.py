from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import List
import pandas as pd
import requests
import io

from algo1 import build_description_clean_one
from ubcf import recommender_ubcf_direct
from ibcf import recommender_ibcf_from_ratings
from cb import ContentBasedRecommender

# =========================
# Initialiser FastAPI
# =========================
app = FastAPI()

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
# Utilitaire : charger et nettoyer le CSV depuis backend Node.js
# =========================
def load_csv():
    try:
        backend_url = "https://recommandit.onrender.com/api/csv/movies"  # ⚠️ route backend locale
        response = requests.get(backend_url)
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

        df.columns = df.columns.str.strip()
        df.columns = df.columns.str.replace("\ufeff", "", regex=False)

        if "userId" in df.columns:
            df["userId"] = df["userId"].astype(str)
        else:
            print("⚠️ load_csv: colonne 'userId' introuvable. Colonnes disponibles:", df.columns.tolist())

        return df

    except Exception as e:
        print("❌ Erreur lors du chargement du CSV depuis backend:", e)
        return pd.DataFrame()

# Charger le CSV une fois et sauvegarder temporairement pour ContentBasedRecommender
df_init = load_csv()
df_init.to_csv("movies_temp.csv", index=False)

# =========================
# Content-Based Recommender
# =========================
cb_reco = ContentBasedRecommender(csv_path="movies_temp.csv")

# =========================
# UBCF
# =========================
@app.post("/ubcf")
async def ubcf_recommend(req: UserRequest):
    df = load_csv()
    if "userId" not in df.columns:
        return {"recommendations": []}

    recs = recommender_ubcf_direct(
        df=df,
        user_object_id=req.userId,
        top_n=req.top_n,
        k=req.k
    )
    return {"recommendations": [{"title": t, "score": float(s)} for t, s in recs]}

# =========================
# IBCF
# =========================
@app.post("/ibcf")
async def ibcf_recommend(req: UserRequest):
    df = load_csv()
    if "userId" not in df.columns:
        return {"recommendations": []}

    df["userId"] = df["userId"].astype(str)
    user_ratings_df = df[df["userId"] == str(req.userId)][["title", "rating"]]
    user_ratings = user_ratings_df.to_dict(orient="records")

    recs = recommender_ibcf_from_ratings(
        df=df,
        user_ratings=user_ratings,
        top_n=req.top_n,
        k=req.k
    )
    return {"recommendations": [{"title": t, "score": float(s)} for t, s in recs]}

# =========================
# Content-Based
# =========================
@app.post("/cb")
async def cb_recommend(req: FavoritesRequest):
    try:
        movie_ids = cb_reco.recommend_from_titles(
            favorites=req.favorites,
            top_n=req.top_n,
            exclude_seen=req.exclude_seen
        )
        return {"success": True, "recommendations": movie_ids}
    except Exception as e:
        return {"success": False, "error": str(e)}

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
            title=title,
            genres=genres,
            year=year,
            actors=actors,
            description=description
        )
        return {"success": True, "description_clean": desc_clean}
    except Exception as e:
        return {"success": False, "error": str(e)}

# =========================
# HYBRID
# =========================
@app.post("/hybrid")
async def hybrid_recommend_api(req: HybridRequest):
    df = load_csv()

    ubcf_recs = recommender_ubcf_direct(df=df, user_object_id=req.userId, top_n=100, k=req.k)
    ibcf_recs = recommender_ibcf_from_ratings(
        df=df,
        user_ratings=[{"title": r.title, "rating": r.rating} for r in req.userRatings],
        top_n=100,
        k=req.k
    )
    content_recs = cb_reco.recommend_from_titles(
        favorites=req.favorites,
        top_n=100,
        exclude_seen=[r.title for r in req.userRatings]
    )

    ibcf_norm = {film: score / 5.0 for film, score in ibcf_recs}
    ubcf_norm = {film: score / 5.0 for film, score in ubcf_recs}
    content_norm = {film: 1.0 for film in content_recs}

    alpha = 0.75
    beta = 0.5
    candidate_films = set(ibcf_norm) | set(ubcf_norm) | set(content_norm)

    cf_scores = {film: beta * ubcf_norm.get(film, 0.0) + (1.0 - beta) * ibcf_norm.get(film, 0.0)
                 for film in candidate_films}
    hybrid_scores = {film: alpha * content_norm.get(film, 0.0) + (1.0 - alpha) * cf_scores.get(film, 0.0)
                     for film in candidate_films}

    seen_titles = {r.title for r in req.userRatings}
    seen_ids = set(df[df["title"].isin(seen_titles)]["movieId"].astype(str).tolist())

    recs = [(film, score) for film, score in hybrid_scores.items()
            if film not in seen_titles and str(film) not in seen_ids]

    recs = sorted(recs, key=lambda x: x[1], reverse=True)[:req.top_n]

    enriched = []
    for film, score in recs:
        row = df[df["movieId"].astype(str) == str(film)].head(1).to_dict(orient="records")
        if row:
            enriched.append({
                "movieId": row[0]["movieId"],
                "title": row[0]["title"],
                "year": row[0].get("year", ""),
                "genres": row[0].get("genres", "").split("|") if row[0].get("genres") else [],
                "description": row[0].get("description", ""),
                "backdrop": row[0].get("backdrop", ""),
                "score": float(score)
            })

    return {"success": True, "recommendations": enriched}
