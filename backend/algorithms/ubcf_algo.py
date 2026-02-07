# backend/algorithms/ubcf_algo.py
import sys
import json
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path
import traceback

def recommender_ubcf_direct(df, user_id, top_n=10, k=20, debug=False):
    """
    UBCF direct:
    - df must contain columns: userId, title, rating
    - user_id can be string or int; function will try to match both
    - returns tuple (list of (title, score), rating_count_in_matrix)
    """
    # Build user-item matrix (users x titles)
    ratings_matrix = df.pivot_table(index="userId", columns="title", values="rating", fill_value=0)

    if debug:
        print(f"[python][debug] ratings_matrix shape: {ratings_matrix.shape}", file=sys.stderr)

    # Try to match user_id in index (support string/int)
    matched_user = None
    # direct match
    if user_id in ratings_matrix.index:
        matched_user = user_id
    else:
        # try int conversion
        try:
            uid_int = int(user_id)
            if uid_int in ratings_matrix.index:
                matched_user = uid_int
        except Exception:
            pass
        # try stringified match
        if matched_user is None:
            str_index = ratings_matrix.index.astype(str)
            if str(user_id) in str_index.values:
                matched_user = ratings_matrix.index[str_index == str(user_id)][0]

    if matched_user is None:
        if debug:
            print(f"[python][debug] user_id '{user_id}' NOT found in ratings_matrix.index", file=sys.stderr)
        return [], 0

    # count how many ratings this user has in the matrix (non-zero entries)
    user_ratings_series = ratings_matrix.loc[matched_user]
    rating_count = int((user_ratings_series != 0).sum())
    if debug:
        print(f"[python][debug] matched_user = {matched_user}, rating_count_in_matrix = {rating_count}", file=sys.stderr)

    # Compute user-user cosine similarity
    user_sim = cosine_similarity(ratings_matrix)
    user_sim_df = pd.DataFrame(user_sim, index=ratings_matrix.index, columns=ratings_matrix.index)

    if debug:
        print(f"[python][debug] user_sim_df shape: {user_sim_df.shape}", file=sys.stderr)

    # Get neighbors for the target user (exclude the user itself)
    try:
        neighbors = user_sim_df.loc[matched_user].sort_values(ascending=False).drop(matched_user).head(k)
    except Exception as e:
        if debug:
            print(f"[python][debug] Error getting neighbors for user_id={matched_user}: {e}", file=sys.stderr)
        return [], rating_count

    if debug:
        print(f"[python][debug] Found neighbors (top {k}): {neighbors.head(10).to_dict()}", file=sys.stderr)

    scores = {}
    for film in ratings_matrix.columns:
        if user_ratings_series.get(film, 0) == 0:
            num, den = 0.0, 0.0
            for neighbor_id, sim in neighbors.items():
                r = ratings_matrix.loc[neighbor_id, film]
                if r > 0:
                    num += sim * r
                    den += abs(sim)
            if den > 0:
                scores[film] = num / den

    top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    if debug:
        print(f"[python][debug] Number of candidate scored films: {len(scores)}", file=sys.stderr)
        print(f"[python][debug] Top results (titles and scores): {top[:10]}", file=sys.stderr)
    return top, rating_count

def enrich_recommendations(df, recs):
    movies = []
    for title, score in recs:
        row = df[df["title"] == title]
        if row.empty:
            continue
        r = row.iloc[0].to_dict()

        # clean actors field if it's a string with brackets/quotes
        actors_raw = r.get("actors") or ""
        if isinstance(actors_raw, str):
            actors_list = [a.strip().strip("'\"[] ") for a in actors_raw.split(",") if a.strip()]
        else:
            actors_list = actors_raw or []

        # normalize year and score
        year_val = None
        try:
            if pd.notna(r.get("year")):
                year_val = int(float(r.get("year")))
        except Exception:
            year_val = r.get("year")

        movies.append({
            "movieId": r.get("movieId"),
            "title": r.get("title"),
            "year": year_val,
            "genres": (r.get("genres") or "").split("|") if r.get("genres") else [],
            "actors": actors_list,
            "backdrop": r.get("backdrop"),
            "description": r.get("description_clean") or r.get("description"),
            "score": round(float(score), 2)
        })
    return movies

def main():
    try:
        # args: user_id top_n k csv_path [debug]
        raw_user_id = sys.argv[1] if len(sys.argv) > 1 else None
        top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        csv_arg = sys.argv[4] if len(sys.argv) > 4 else None
        debug_flag = (len(sys.argv) > 5 and sys.argv[5].lower() in ("1", "true", "debug"))

        if not raw_user_id:
            print(json.dumps({"success": False, "error": "missing user_id"}))
            sys.exit(1)

        # Resolve CSV path robustly (default to movies_enriched.backup.csv)
        script_dir = Path(__file__).resolve().parent
        if csv_arg:
            csv_path = Path(csv_arg)
        else:
            csv_path = script_dir.parent / "movies_enriched.backup.csv"
        if not csv_path.exists():
            alt = script_dir.parent.parent / "movies_enriched.backup.csv"
            if alt.exists():
                csv_path = alt

        if not csv_path.exists():
            raise FileNotFoundError(f"CSV not found at {csv_path}")

        # Load CSV forcing userId to string to avoid type mismatch
        if debug_flag:
            print(f"[python][debug] Loading CSV from: {csv_path}", file=sys.stderr)
        df = pd.read_csv(csv_path, encoding="utf-8", on_bad_lines="skip", dtype={"userId": str})

        # Ensure userId column is string to avoid type mismatch
        df["userId"] = df["userId"].astype(str).str.strip().replace(r"\.0$", "", regex=True)

        if debug_flag:
            # Basic diagnostics
            print(f"[python][debug] CSV loaded rows={len(df)}, columns={list(df.columns)}", file=sys.stderr)
            try:
                sample_ids = df["userId"].dropna().astype(str).unique()[:20].tolist()
                print(f"[python][debug] sample userId values (first 20): {sample_ids}", file=sys.stderr)
            except Exception as e:
                print(f"[python][debug] Could not sample userId column: {e}", file=sys.stderr)

        # Run recommender
        recs, rating_count = recommender_ubcf_direct(df, raw_user_id, top_n=top_n, k=k, debug=debug_flag)
        movies = enrich_recommendations(df, recs)

        # Output JSON (recommendations list + rating count found in CSV)
        out = {"recommendations": movies, "ratingCountInCSV": rating_count}
        print(json.dumps(out, ensure_ascii=False))
    except Exception as e:
        # Always print JSON on error so Node can parse it
        err = {
            "success": False,
            "error": "Algo error",
            "details": str(e),
            "trace": traceback.format_exc()
        }
        print(json.dumps(err, ensure_ascii=False))
        print(f"[python][debug] Exception: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
