import re, ast, pandas as pd
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer

# Charger le modèle français de spaCy
nlp = spacy.load("fr_core_news_sm")

# --- Helpers ---------------------------------------------------------------

def clean_year(year):
    if pd.isna(year):
        return ""
    y = str(year).strip()
    if re.match(r"^\d+(\.0+)?$", y):
        y = str(int(float(y)))
    m = re.search(r"\b(19|20)\d{2}\b", y)
    return m.group(0) if m else y

def normalize_token(token):
    token = str(token).lower().strip()
    token = re.sub(r"[^a-z\s-]", " ", token)  # garder le tiret pour sci-fi
    token = re.sub(r"\s+", " ", token).strip()
    return token

def normalize_genre_token(token):
    t = normalize_token(token)
    t = t.replace("sci fi", "scifi").replace("science fiction", "scifi")
    t = t.replace("romantic comedy", "romcom")
    t = t.replace("-", "")
    return t

def normalize_genres_sorted(genres_list):
    if not genres_list:
        return "", "", []
    parts = [normalize_genre_token(p) for p in genres_list if p.strip()]
    parts = [p for p in parts if p]
    parts = sorted(set(parts))
    if not parts:
        return "", "", []
    separated = " ".join(parts)   # genres séparés par espace
    combined = "".join(parts)     # genres concaténés
    return separated, combined, parts

def parse_actors(actors_str):
    if not actors_str:
        return []
    s = str(actors_str).strip()
    actors = []
    try:
        parsed = ast.literal_eval(s)
        if isinstance(parsed, (list, tuple)):
            actors = [str(a) for a in parsed]
        else:
            actors = [s]
    except Exception:
        actors = [a for a in s.split(",") if a.strip()]
    norm = []
    for a in actors:
        a = a.strip().lower()
        a = re.sub(r"[^a-z0-9]", "", a)
        if a:
            norm.append(a)
    seen = set()
    out = []
    for a in norm:
        if a not in seen:
            seen.add(a)
            out.append(a)
    return out

def normalize_actors(actors_str):
    return " ".join(parse_actors(actors_str))

def preprocess_description(desc):
    desc = str(desc).lower()
    desc = re.sub(r"[^a-zàâäéèêëîïôöùûüç\s-]", " ", desc)
    desc = re.sub(r"\s+", " ", desc).strip()
    doc = nlp(desc)
    tokens = []
    for tok in doc:
        if tok.is_stop or len(tok.lemma_) < 3:
            continue
        tokens.append(tok.lemma_)
    return " ".join(tokens)

def add_special_combinations(genres_list):
    combos = []
    gset = set(genres_list)

    if "drama" in gset and "romance" in gset:
        combos.append("dramaromance")
    if "comedy" in gset and "romance" in gset:
        combos.append("comedyromance")
    if "action" in gset and "scifi" in gset:
        combos.append("actionscifi")
    if "animation" in gset and "comedy" in gset:
        combos.append("animationcomedy")
    if "action" in gset and "comedy" in gset:
        combos.append("actioncomedy")
    if "thriller" in gset and "horror" in gset:
        combos.append("thrillerhorror")
    if "crime" in gset and "thriller" in gset:
        combos.append("crimethriller")
    if "fantasy" in gset and "adventure" in gset:
        combos.append("fantasyadventure")
    if "war" in gset and "drama" in gset:
        combos.append("wardrama")
    if "western" in gset and "crime" in gset:
        combos.append("westerncrime")
    if "mystery" in gset and "thriller" in gset:
        combos.append("mysterythriller")
    if "action" in gset and "adventure" in gset:
        combos.append("actionadventure")
    if "comedy" in gset and "drama" in gset:
        combos.append("comedydrama")
    if "scifi" in gset and "thriller" in gset:
        combos.append("scifithriller")
    if "fantasy" in gset and "romance" in gset:
        combos.append("fantasyromance")

    return " ".join(combos)

# --- Build description_clean pour un seul film -----------------------------

def build_description_clean_one(title, genres, year, actors, description, tfidf_top_k=15):
    year_clean = clean_year(year)
    genres_sorted, genres_combined, genres_list = normalize_genres_sorted(genres)
    special_combos = add_special_combinations(genres_list)
    actors_clean = normalize_actors(actors)

    pre_desc = preprocess_description(description)

    # TF-IDF sur la description du film
    vect = TfidfVectorizer(max_features=8000)
    tfidf_matrix = vect.fit_transform([pre_desc])
    feature_names = vect.get_feature_names_out()
    row = tfidf_matrix[0].toarray().flatten()
    nonzero = [(feature_names[idx], row[idx]) for idx in row.nonzero()[0]]
    nonzero.sort(key=lambda x: x[1], reverse=True)
    top_tokens = [w for w, _ in nonzero[:tfidf_top_k]]

    description_clean = (
        year_clean + " " +
        genres_sorted + " " +
        genres_combined + " " +
        special_combos + " " +
        actors_clean + " " +
        " ".join(top_tokens)
    ).strip()

    return description_clean
