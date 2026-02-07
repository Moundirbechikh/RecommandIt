# ibcf.py
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def recommender_ibcf_from_ratings(df, user_ratings, top_n=10, k=5):
    """
    IBCF – Item-Based Collaborative Filtering basé sur les notes réelles de l'utilisateur.
    
    Paramètres :
    - df : DataFrame contenant au minimum les colonnes [userId, title, rating]
    - user_ratings : liste de dicts [{"title": str, "rating": float}]
    - top_n : nombre de recommandations à retourner
    - k : nombre de voisins les plus proches à considérer
    
    Retour :
    - liste de tuples (title, score)
    """

    if df.empty:
        return []

    # Construire matrice items × users
    ratings_matrix = df.pivot_table(
        index="title",
        columns="userId",
        values="rating",
        fill_value=0
    )
    if ratings_matrix.empty:
        return []

    # Similarité entre items
    item_sim = cosine_similarity(ratings_matrix)
    item_sim_df = pd.DataFrame(item_sim, index=ratings_matrix.index, columns=ratings_matrix.index)

    # Construire le vecteur utilisateur (title -> rating)
    user_vector = pd.Series(0.0, index=ratings_matrix.index)
    for entry in user_ratings:
        t = entry.get("title")
        r = entry.get("rating")
        if t in user_vector.index and isinstance(r, (int, float)):
            user_vector[t] = float(r)

    scores = {}

    # Pour chaque film non noté par l'utilisateur
    for film in ratings_matrix.index:
        if user_vector[film] == 0:
            # k voisins les plus proches
            neighbors = item_sim_df[film].sort_values(ascending=False).drop(film).head(k)
            num, den = 0.0, 0.0
            for neighbor_film, sim in neighbors.items():
                r = user_vector[neighbor_film]
                if r > 0:
                    num += sim * r
                    den += abs(sim)
            if den > 0:
                scores[film] = num / den

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
