import pandas as pd
from ubcf import recommender_ubcf_direct
from ibcf import recommender_ibcf_from_ratings
from cb import ContentBasedRecommender

def hybrid_recommender(df, user_id, cb_reco,
                       top_n=20, k=41,
                       alpha=0.75, beta=0.5):
    """
    Hybrid recommender: combine IBCF + UBCF + Content-Based
    - df: DataFrame avec colonnes [userId, title, rating]
    - user_id: identifiant utilisateur
    - cb_reco: instance de ContentBasedRecommender déjà initialisée
    - top_n: nombre de recommandations finales
    - k: nombre de voisins pour UBCF/IBCF
    - alpha: poids du contenu
    - beta: poids du UBCF dans le collaboratif
    """

    # === Récupérer les notes de l’utilisateur pour IBCF ===
    df["userId"] = df["userId"].astype(str)
    user_ratings_df = df[df["userId"] == str(user_id)][["title", "rating"]]
    user_ratings = user_ratings_df.to_dict(orient="records")

    # === Exécuter IBCF et UBCF ===
    ibcf_results = recommender_ibcf_from_ratings(df=df, user_ratings=user_ratings, top_n=None, k=k)
    ubcf_results = recommender_ubcf_direct(df=df, user_object_id=user_id, top_n=None, k=k)

    # === Exécuter Content-Based via cb_reco ===
    favorites = df[df["userId"] == str(user_id)]["title"].unique().tolist()
    content_results = cb_reco.recommend_from_titles(
        favorites=favorites,
        top_n=len(cb_reco.movies_df),
        exclude_seen=[]
    )

    # === Normaliser les résultats ===
    ibcf_norm = {film: score / 5.0 for film, score in ibcf_results}
    ubcf_norm = {film: score / 5.0 for film, score in ubcf_results}

    # Adapter selon le format de sortie de ContentBasedRecommender
    if isinstance(content_results, list):
        if all(isinstance(x, str) for x in content_results):
            # liste de titres
            content_norm = {film: 1.0 for film in content_results}
        elif all(isinstance(x, dict) for x in content_results):
            # liste de dicts
            content_norm = {rec["title"]: rec.get("score", 1.0) for rec in content_results}
        else:
            content_norm = {}
    else:
        content_norm = {}

    # === Calcul du score collaboratif (UBCF + IBCF) ===
    cf_scores = {}
    candidate_films = set(ibcf_norm) | set(ubcf_norm) | set(content_norm)
    for film in candidate_films:
        s_ibcf = ibcf_norm.get(film, 0.0)
        s_ubcf = ubcf_norm.get(film, 0.0)
        cf_scores[film] = beta * s_ubcf + (1.0 - beta) * s_ibcf

    # === Score hybride final ===
    hybrid_scores = {}
    for film in candidate_films:
        s_content = content_norm.get(film, 0.0)
        s_cf = cf_scores.get(film, 0.0)
        hybrid_scores[film] = alpha * s_content + (1.0 - alpha) * s_cf

    # === Retourner Top N ===
    return sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
