# backend/algorithms/inspect_csv_users.py
import pandas as pd
from pathlib import Path
import sys

CSV_PATH = Path("backend/movies_enriched.backup.csv")

def summary():
    if not CSV_PATH.exists():
        print("CSV introuvable:", CSV_PATH)
        return
    df = pd.read_csv(CSV_PATH, usecols=["userId", "movieId", "title", "rating"], on_bad_lines="skip", dtype={"userId": str})
    df["userId"] = df["userId"].astype(str)
    total_rows = len(df)
    valid = df[df["rating"].notna()]
    counts = valid.groupby("userId").agg(rating_count=("rating", "count"), unique_movies=("movieId", "nunique")).reset_index()
    counts = counts.sort_values("rating_count", ascending=False)
    print(f"Total lignes CSV: {total_rows}")
    print(f"Utilisateurs avec au moins 1 rating: {len(counts)}")
    print("\nTop 20 users par nombre de ratings:")
    print(counts.head(20).to_string(index=False))
    counts.to_csv(Path("backend/user_rating_counts.csv"), index=False)
    print("\nRésumé écrit dans backend/user_rating_counts.csv")

def inspect_user(uid):
    if not CSV_PATH.exists():
        print("CSV introuvable:", CSV_PATH)
        return
    df = pd.read_csv(CSV_PATH, usecols=["userId", "movieId", "title", "rating"], on_bad_lines="skip", dtype={"userId": str})
    df["userId"] = df["userId"].astype(str)
    uid = str(uid)
    user_rows = df[df["userId"] == uid]
    if user_rows.empty:
        print(f"Aucune note trouvée pour userId = {uid}")
        # proposer quelques userId similaires (prefix)
        prefix = uid[:6]
        similar = df[df["userId"].str.contains(prefix, na=False)]["userId"].unique()[:10]
        if len(similar) > 0:
            print("Exemples d'userId similaires (prefix):", similar.tolist())
        return
    print(f"userId = {uid} -> {len(user_rows)} ratings, {user_rows['movieId'].nunique()} films uniques")
    print(user_rows[["movieId", "title", "rating"]].head(200).to_string(index=False))

if __name__ == "__main__":
    if len(sys.argv) == 1:
        summary()
    else:
        inspect_user(sys.argv[1])
