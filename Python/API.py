from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import List
import pandas as pd
import os

from algo1 import build_description_clean_one
from ubcf import recommender_ubcf_direct
from ibcf import recommender_ibcf_from_ratings
from cb import ContentBasedRecommender

# =========================
# Initialiser FastAPI
# =========================
app = FastAPI()

# Chemin relatif vers le CSV
CSV_PATH = os.path.join(os.path.dirname(__file__), "../backend/movies_enriched.csv")

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
# Content-Based Recommender
# =========================
cb_reco = ContentBasedRecommender(csv_path=CSV_PATH)

# =========================
# Utilitaire : charger et nettoyer le CSV
# =========================
def load_csv():
    df = pd.read_csv(
        CSV_PATH,
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
    print(f"📊 UBCF: user {req.userId} a {len(recs)} recommandations")
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
    print(f"📊 IBCF: user {req.userId} a {len(user_ratings)} films notés, {len(recs)} recommandations")
    return {"recommendations": [{"title": t, "score": float(s)} for t, s in recs]}

# =========================
# Content-Based
# =========================
@app.post("/cb")
async def cb_recommend(req: FavoritesRequest):
    try:
        cb_reco = ContentBasedRecommender(csv_path=CSV_PATH)
        movie_ids = cb_reco.recommend_from_titles(
            favorites=req.favorites,
            top_n=req.top_n,
            exclude_seen=req.exclude_seen
        )
        print(f"📊 CB: favoris {req.favorites}, {len(movie_ids)} recommandations")
        return {"success": True, "recommendations": movie_ids}
    except Exception as e:
        print("❌ CB error:", e)
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
    print("\n====================== HYBRIDE DEBUG ======================")
    print("📩 Requête reçue pour userId:", req.userId)

    # === UBCF ===
    ubcf_recs = recommender_ubcf_direct(
        df=df,
        user_object_id=req.userId,
        top_n=100,   # 🔥 demander 100 candidats
        k=req.k
    )
    print("📊 UBCF recommandations:", len(ubcf_recs))

    # === IBCF ===
    ibcf_recs = recommender_ibcf_from_ratings(
        df=df,
        user_ratings=[{"title": r.title, "rating": r.rating} for r in req.userRatings],
        top_n=100,   # 🔥 demander 100 candidats
        k=req.k
    )
    print("📊 IBCF recommandations:", len(ibcf_recs))

    # === Content-Based ===
    content_recs = cb_reco.recommend_from_titles(
        favorites=req.favorites,
        top_n=100,   # 🔥 demander 100 candidats
        exclude_seen=[r.title for r in req.userRatings]
    )
    print("📊 CB recommandations:", len(content_recs))

    # === Normalisation ===
    ibcf_norm = {film: score / 5.0 for film, score in ibcf_recs}
    ubcf_norm = {film: score / 5.0 for film, score in ubcf_recs}
    content_norm = {film: 1.0 for film in content_recs}

    # === Fusion ===
    alpha = 0.75
    beta = 0.5
    candidate_films = set(ibcf_norm) | set(ubcf_norm) | set(content_norm)
    print("📌 Nombre total de candidats fusionnés:", len(candidate_films))

    cf_scores = {}
    for film in candidate_films:
        s_ibcf = ibcf_norm.get(film, 0.0)
        s_ubcf = ubcf_norm.get(film, 0.0)
        cf_scores[film] = beta * s_ubcf + (1.0 - beta) * s_ibcf

    hybrid_scores = {}
    for film in candidate_films:
        s_content = content_norm.get(film, 0.0)
        s_cf = cf_scores.get(film, 0.0)
        hybrid_scores[film] = alpha * s_content + (1.0 - alpha) * s_cf

    # === Exclure les films déjà notés par l’utilisateur ===
    seen_titles = {r.title for r in req.userRatings}
    seen_ids = set(df[df["title"].isin(seen_titles)]["movieId"].astype(str).tolist())

    recs = [
        (film, score)
        for film, score in hybrid_scores.items()
        if film not in seen_titles and str(film) not in seen_ids
    ]

    # === Tronquer à req.top_n (ex: 20) ===
    recs = sorted(recs, key=lambda x: x[1], reverse=True)[:req.top_n]
    print("🎯 Hybrid recommandations calculées:", len(recs))
    print("📌 Premières recommandations:", recs[:5])
    print("====================== HYBRIDE END ======================\n")

    # 🔥 Enrichir avec CSV pour avoir id + title
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

