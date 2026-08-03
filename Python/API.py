from fastapi import FastAPI, Body, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import time
import logging
import traceback
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from algo1 import build_description_clean_one
from ubcf import recommender_ubcf_direct
from ibcf import recommender_ibcf_from_ratings
from cb import ContentBasedRecommender  # ⚡️ version adaptée pour MongoDB

# =========================
# Logging
# =========================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("recommendit-api")

# =========================
# Initialiser FastAPI
# =========================
app = FastAPI()

# =========================
# Middleware : log chaque requête + capture toute erreur non gérée
# avec le traceback complet (pour voir la VRAIE faille dans les logs Render)
# =========================
@app.middleware("http")
async def log_and_catch_errors(request: Request, call_next):
    start = time.time()
    logger.info(f"➡️  {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        duration = round((time.time() - start) * 1000)
        logger.info(f"⬅️  {request.method} {request.url.path} -> {response.status_code} ({duration}ms)")
        return response
    except Exception as e:
        duration = round((time.time() - start) * 1000)
        logger.error(f"💥 {request.method} {request.url.path} a crashé après {duration}ms")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e), "type": type(e).__name__},
        )

# =========================
# Connexion MongoDB Atlas
# =========================
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
logger.info(f"🔎 MONGO_URI défini: {bool(MONGO_URI)}")

client = AsyncIOMotorClient(MONGO_URI)
db = client["RecommendIT"]
movies_collection = db["movies"]
rates_collection = db["rates"]

# cb_reco et cache des films
cb_reco: Optional[ContentBasedRecommender] = None
movies_map: Dict[int, Dict[str, Any]] = {}
_movies_count_cache: int = 0  # compteur local du nombre de films préchargés

# =========================
# Helpers cache / refresh
# =========================
async def load_movies_cache():
    """
    Recharge entièrement le cache movies_map depuis MongoDB.
    """
    global movies_map, _movies_count_cache
    movies_docs = await movies_collection.find({}, {
        "movieId": 1, "title": 1, "year": 1,
        "genres": 1, "description": 1, "backdrop": 1
    }).to_list(None)
    movies_map = {}
    for m in movies_docs:
        try:
            mid = int(m.get("movieId"))
        except Exception:
            continue
        movies_map[mid] = m
    _movies_count_cache = len(movies_map)
    logger.info(f"📊 Cache films rechargé: {_movies_count_cache} films")

async def refresh_movies_cache_if_needed():
    """
    Vérifie le nombre de documents dans la collection movies.
    Si différent du cache local, recharge le cache.
    """
    global _movies_count_cache
    try:
        count = await movies_collection.count_documents({})
    except Exception as e:
        logger.error(f"❌ Impossible de compter les films dans MongoDB: {e}")
        return
    if count != _movies_count_cache:
        logger.info(f"🔁 Changement détecté dans movies (db={count} vs cache={_movies_count_cache}), rechargement...")
        await load_movies_cache()
    else:
        logger.info(f"✅ Cache films à jour ({_movies_count_cache} films)")

# =========================
# Route Keep-Alive (Anti-sommeil Render)
# =========================
@app.get("/keep-alive")
async def keep_alive():
    """
    Cette route sert uniquement à empêcher Render de mettre le serveur en veille.
    Elle renvoie un message simple et un code 200 OK.
    """
    logger.info("🛰️ Ping reçu : Instance maintenue en éveil.")
    return {"status": "alive", "message": "RecommendIT backend is running"}

# =========================
# Startup: initialisation du cache et du CB recommender
# =========================
@app.on_event("startup")
async def startup_event():
    global cb_reco
    try:
        await client.admin.command("ping")
        logger.info("✅ Connecté à MongoDB Atlas")

        await load_movies_cache()

        cb_reco = await ContentBasedRecommender.create(movies_collection)
        logger.info("✅ ContentBasedRecommender initialisé")
    except Exception as e:
        logger.error("❌ Erreur au démarrage:")
        logger.error(traceback.format_exc())
        raise e

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
# UBCF
# =========================
@app.post("/ubcf")
async def ubcf_recommend(req: UserRequest):
    await refresh_movies_cache_if_needed()

    df_list = []
    async for rate in rates_collection.find():
        for r in rate.get("ratings", []):
            film_id = r.get("filmId")
            if film_id is None:
                continue
            movie = movies_map.get(int(film_id))
            if movie:
                df_list.append({
                    "userId": str(rate.get("userId")),
                    "title": movie.get("title"),
                    "rating": r.get("note", r.get("rating"))
                })

    df = pd.DataFrame(df_list)
    recs = recommender_ubcf_direct(df=df, user_object_id=req.userId, top_n=req.top_n, k=req.k)
    return {"recommendations": [{"title": t, "score": float(s)} for t, s in recs]}

# =========================
# IBCF
# =========================
@app.post("/ibcf")
async def ibcf_recommend(req: UserRequest):
    await refresh_movies_cache_if_needed()

    df_list = []
    async for rate in rates_collection.find():
        for r in rate.get("ratings", []):
            film_id = r.get("filmId")
            if film_id is None:
                continue
            movie = movies_map.get(int(film_id))
            if movie:
                df_list.append({
                    "userId": str(rate.get("userId")),
                    "title": movie.get("title"),
                    "rating": r.get("note", r.get("rating"))
                })

    df = pd.DataFrame(df_list)
    user_ratings = [d for d in df_list if d["userId"] == str(req.userId)]

    recs = recommender_ibcf_from_ratings(df=df, user_ratings=user_ratings, top_n=req.top_n, k=req.k)
    return {"recommendations": [{"title": t, "score": float(s)} for t, s in recs]}

# =========================
# Content-Based
# =========================
@app.post("/cb")
async def cb_recommend(req: FavoritesRequest):
    await refresh_movies_cache_if_needed()

    try:
        cb_reco = await ContentBasedRecommender.create(movies_collection)

        movie_ids = cb_reco.recommend_from_titles(
            favorites=req.favorites,
            top_n=req.top_n,
            exclude_seen=req.exclude_seen
        )
        logger.info(f"🔎 Content-Based recs ({len(movie_ids)}): {movie_ids[:5]}")
        return {"success": True, "recommendations": movie_ids}
    except Exception as e:
        logger.error("❌ Erreur /cb:")
        logger.error(traceback.format_exc())
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
        desc_clean = build_description_clean_one(title=title, genres=genres, year=year, actors=actors, description=description)
        return {"success": True, "description_clean": desc_clean}
    except Exception as e:
        logger.error("❌ Erreur /description_clean:")
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e)}

@app.post("/hybrid")
async def hybrid_recommend_api(req: HybridRequest):
    logger.info("====================== HYBRID DEBUG ======================")
    logger.info(f"📩 Payload reçu: {req.dict()}")

    await refresh_movies_cache_if_needed()

    df_list = []
    user_seen_titles_db = set()
    user_seen_ids_db = set()

    async for rate in rates_collection.find():
        uid = str(rate.get("userId"))
        for r in rate.get("ratings", []):
            film_id = r.get("filmId")
            if film_id is None:
                continue
            movie = movies_map.get(int(film_id))
            if movie:
                df_list.append({
                    "userId": uid,
                    "title": movie.get("title"),
                    "rating": r.get("note", r.get("rating"))
                })
                if uid == str(req.userId):
                    user_seen_titles_db.add(movie.get("title"))
                    user_seen_ids_db.add(int(film_id))

    user_seen_titles_payload = {r.title for r in req.userRatings}
    seen_titles = user_seen_titles_db | user_seen_titles_payload
    title_to_id = {m["title"]: int(m["movieId"]) for m in movies_map.values() if "movieId" in m and "title" in m}
    id_to_title = {int(m["movieId"]): m["title"] for m in movies_map.values() if "movieId" in m and "title" in m}

    seen_ids = set(user_seen_ids_db)
    for t in user_seen_titles_payload:
        mid = title_to_id.get(t)
        if mid is not None:
            seen_ids.add(mid)

    df = pd.DataFrame(df_list)

    ubcf_recs = recommender_ubcf_direct(df=df, user_object_id=req.userId, top_n=100, k=req.k)

    user_ratings_list = [{"title": r.title, "rating": r.rating} for r in req.userRatings]
    ibcf_recs = recommender_ibcf_from_ratings(df=df, user_ratings=user_ratings_list, top_n=100, k=req.k)

    cb_reco = await ContentBasedRecommender.create(movies_collection)
    content_recs = cb_reco.recommend_with_details(
        favorites=req.favorites,
        top_n=100,
        exclude_seen=list(seen_titles)
    )

    ibcf_norm = {}
    for film, score in ibcf_recs:
        mid = title_to_id.get(film)
        if mid:
            ibcf_norm[mid] = score / 5.0

    ubcf_norm = {}
    for film, score in ubcf_recs:
        mid = title_to_id.get(film)
        if mid:
            ubcf_norm[mid] = score / 5.0

    content_norm = {rec["movieId"]: rec["score"] for rec in content_recs}

    alpha = 0.75
    beta = 0.5
    candidate_films = set(ibcf_norm) | set(ubcf_norm) | set(content_norm)

    def is_seen(mid):
        return mid in seen_ids

    candidate_films = {mid for mid in candidate_films if not is_seen(mid)}

    hybrid_scores = {}
    for mid in candidate_films:
        score_cb = content_norm.get(mid, 0.0)
        score_cf = beta * ubcf_norm.get(mid, 0.0) + (1.0 - beta) * ibcf_norm.get(mid, 0.0)
        score = alpha * score_cb + (1.0 - alpha) * score_cf
        hybrid_scores[mid] = score

    recs = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:req.top_n]

    enriched = []
    for mid, score in recs:
        movie = movies_map.get(mid)
        if movie:
            enriched.append({
                "movieId": mid,
                "title": id_to_title.get(mid, ""),
                "year": movie.get("year", ""),
                "genres": movie.get("genres", []),
                "description": movie.get("description", ""),
                "backdrop": movie.get("backdrop", ""),
                "score": float(score)
            })

    logger.info(f"🎯 Nombre de recommandations enrichies: {len(enriched)}")
    logger.info(f"📌 Premières recommandations enrichies: {enriched[:3]}")
    logger.info("====================== HYBRID END ======================")

    return {"success": True, "recommendations": enriched}
