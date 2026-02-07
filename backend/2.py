import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def recommender_ubcf_direct(df, user_id, top_n=10, k=41):
    """
    Direct UBCF recommender:
    - df must contain columns: userId, title, rating
    - k: number of nearest neighbors
    - returns a list of (title, score) for top_n recommended films
    """
    # Build user–item matrix
    ratings_matrix = df.pivot_table(index="userId", columns="title", values="rating", fill_value=0)

    if user_id not in ratings_matrix.index:
        return []

    # Cosine similarity across users
    user_sim = cosine_similarity(ratings_matrix)
    user_sim_df = pd.DataFrame(user_sim, index=ratings_matrix.index, columns=ratings_matrix.index)

    # Neighbors
    neighbors = user_sim_df.loc[user_id].sort_values(ascending=False).drop(user_id).head(k)

    # Weighted scores for non-rated films
    scores = {}
    user_ratings = ratings_matrix.loc[user_id]

    for film in ratings_matrix.columns:
        if user_ratings[film] == 0:  # non-rated by target user
            num, den = 0.0, 0.0
            for neighbor_id, sim in neighbors.items():
                r = ratings_matrix.loc[neighbor_id, film]
                if r > 0:
                    num += sim * r
                    den += abs(sim)
            if den > 0:
                scores[film] = num / den

    # Return top_n sorted by score
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]

BASE_DIR = os.path.dirname(__file__)   # dossier où se trouve ce script
CSV_PATH = os.path.join(BASE_DIR, "movies_enriched.csv")

# Charger le CSV
df_full = pd.read_csv(CSV_PATH, encoding="utf-8", sep=",", on_bad_lines="skip")

# Exemple d’appel
recs = recommender_ubcf_direct(df_full, user_id="6924d13a738e233a54b07eb7", top_n=20, k=41)

print(f"=== Recommandations UBCF pour l’utilisateur 6924d13a738e233a54b07eb7 (k=41) ===")
for title, score in recs:
    print(f"- {title} (score={score:.3f})")
