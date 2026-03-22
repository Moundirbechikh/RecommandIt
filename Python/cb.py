from typing import List, Dict, Any, Optional
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords

# nltk.download("stopwords")  # à lancer une fois si nécessaire


class ContentBasedRecommender:
    def __init__(self, df, text_col="description_clean", title_col="title", movieid_col="movieId", max_features=5000):
        """
        Initialise le recommender avec un DataFrame (déjà chargé depuis MongoDB).
        """
        self.text_col = text_col
        self.title_col = title_col
        self.movieid_col = movieid_col

        # Construire movies_df unique
        self.movies_df = (
            df[[self.movieid_col, self.title_col, self.text_col]]
            .drop_duplicates(subset=self.title_col)
            .reset_index(drop=True)
        )

        # Stopwords français + personnalisés
        try:
            nltk_stopwords = set(stopwords.words("french"))
        except Exception:
            nltk_stopwords = set()
        custom_stopwords = {"film", "cinema", "histoire", "faire"}
        french_stopwords = list(nltk_stopwords.union(custom_stopwords))

        # TF-IDF
        self.tfidf_vect = TfidfVectorizer(stop_words=french_stopwords, max_features=max_features)
        texts = self.movies_df[self.text_col].fillna("").astype(str).values
        self.tfidf_matrix = self.tfidf_vect.fit_transform(texts)

        # Matrice de similarité cosinus
        self.cosine_sim = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)

        # Index maps
        self.title_to_index = {t: i for i, t in enumerate(self.movies_df[self.title_col].values)}

        def _to_int_safe(x):
            try:
                return int(x)
            except Exception:
                return x

        self.movieid_to_index = {
            _to_int_safe(self.movies_df.iloc[i][self.movieid_col]): i
            for i in range(len(self.movies_df))
        }

    @classmethod
    async def create(cls, mongo_collection, **kwargs):
        """
        Méthode async pour charger les films depuis MongoDB avec Motor.
        """
        docs = await mongo_collection.find({}, {
            "movieId": 1,
            "title": 1,
            "description_clean": 1
        }).to_list(length=None)

        df = pd.DataFrame(docs)
        return cls(df, **kwargs)

    def recommend_from_titles(
        self,
        favorites: List[str],
        top_n: int = 20,
        per_fav: int = 50,
        exclude_seen: Optional[List[Any]] = None,
        aggregate_by: str = "sum",
    ) -> List[int]:
        """
        Prend une liste de titres favoris et renvoie une liste de movieId (top_n).
        """
        exclude_seen_set = set()
        if exclude_seen:
            for x in exclude_seen:
                try:
                    exclude_seen_set.add(int(x))
                except Exception:
                    exclude_seen_set.add(x)

        candidates: Dict[Any, float] = {}
        sources: Dict[Any, List[str]] = {}

        for fav in favorites:
            if fav not in self.title_to_index:
                continue
            idx = self.title_to_index[fav]
            sim_scores = list(enumerate(self.cosine_sim[idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

            count = 0
            for i, score in sim_scores:
                if i == idx:
                    continue
                movie_id_raw = self.movies_df.iloc[i][self.movieid_col]
                try:
                    movie_id = int(movie_id_raw)
                except Exception:
                    movie_id = movie_id_raw
                if movie_id in exclude_seen_set:
                    continue

                if aggregate_by == "sum":
                    candidates[movie_id] = candidates.get(movie_id, 0.0) + float(score)
                else:
                    candidates[movie_id] = max(candidates.get(movie_id, 0.0), float(score))

                sources.setdefault(movie_id, []).append(fav)

                count += 1
                if count >= per_fav:
                    break

        sorted_cands = sorted(candidates.items(), key=lambda x: x[1], reverse=True)

        result = []
        for mid, _ in sorted_cands[:top_n]:
            try:
                result.append(int(mid))
            except Exception:
                result.append(mid)
        return result

    def recommend_with_details(
        self,
        favorites: List[str],
        top_n: int = 20,
        per_fav: int = 50,
        exclude_seen: Optional[List[Any]] = None,
        aggregate_by: str = "sum",
    ) -> List[Dict[str, Any]]:
        """
        Même chose que recommend_from_titles mais renvoie des objets détaillés.
        """
        exclude_seen_set = set()
        if exclude_seen:
            for x in exclude_seen:
                try:
                    exclude_seen_set.add(int(x))
                except Exception:
                    exclude_seen_set.add(x)

        candidates: Dict[Any, float] = {}
        sources: Dict[Any, List[str]] = {}
        titles_map: Dict[Any, str] = {}

        for fav in favorites:
            if fav not in self.title_to_index:
                continue
            idx = self.title_to_index[fav]
            sim_scores = list(enumerate(self.cosine_sim[idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

            count = 0
            for i, score in sim_scores:
                if i == idx:
                    continue
                movie_id_raw = self.movies_df.iloc[i][self.movieid_col]
                try:
                    movie_id = int(movie_id_raw)
                except Exception:
                    movie_id = movie_id_raw
                if movie_id in exclude_seen_set:
                    continue

                if aggregate_by == "sum":
                    candidates[movie_id] = candidates.get(movie_id, 0.0) + float(score)
                else:
                    candidates[movie_id] = max(candidates.get(movie_id, 0.0), float(score))

                sources.setdefault(movie_id, []).append(fav)
                titles_map[movie_id] = self.movies_df.iloc[i][self.title_col]

                count += 1
                if count >= per_fav:
                    break

        sorted_cands = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
        result = []
        for mid, score in sorted_cands[:top_n]:
            result.append({
                "movieId": int(mid) if str(mid).isdigit() else mid,
                "title": titles_map.get(mid, ""),
                "score": float(score),
                "sources": sources.get(mid, []),
            })
        return result
