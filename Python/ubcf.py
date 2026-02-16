import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix

def recommender_ubcf_direct(df, user_object_id, top_n=10, k=20):
    """
    UBCF – User-Based Collaborative Filtering optimisé
    """

    if df.empty:
        return []

    # Matrice utilisateurs × films
    ratings_matrix = df.pivot_table(
        index="userId",
        columns="title",
        values="rating",
        fill_value=0
    )

    if ratings_matrix.empty:
        return []

    # Vérifier que l'userId existe
    if user_object_id not in ratings_matrix.index:
        print(f"❌ UBCF: userId {user_object_id} introuvable dans le CSV")
        return []

    # Convertir en float32 pour réduire la mémoire
    ratings_matrix = ratings_matrix.astype("float32")

    # Transformer en matrice creuse
    sparse_matrix = csr_matrix(ratings_matrix.values)

    # Similarité utilisateur-utilisateur (matrice creuse)
    user_sim_sparse = cosine_similarity(sparse_matrix, dense_output=False)

    # Convertir en DataFrame
    user_sim_df = pd.DataFrame(
        user_sim_sparse.toarray(),  # ⚠️ tu peux éviter toarray() si tu veux rester en sparse
        index=ratings_matrix.index,
        columns=ratings_matrix.index
    )

    # Récupérer les notes de l'utilisateur
    user_ratings = ratings_matrix.loc[user_object_id]

    # k voisins les plus proches
    neighbors = (
        user_sim_df.loc[user_object_id]
        .sort_values(ascending=False)
        .drop(user_object_id)
        .head(k)
    )

    scores = {}

    # Prédiction des films non notés
    for film in ratings_matrix.columns:
        if user_ratings[film] == 0:
            num, den = 0.0, 0.0
            for neighbor_id, sim in neighbors.items():
                r = ratings_matrix.loc[neighbor_id, film]
                if r > 0:
                    num += sim * r
                    den += abs(sim)
            if den > 0:
                scores[film] = num / den

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
