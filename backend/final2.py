import pandas as pd
import os

# Chemin vers ton CSV (dans le même dossier que ce script)
BASE_DIR = os.path.dirname(__file__) 
CSV_PATH = os.path.join(BASE_DIR, "movies_enriched.csv")

# Charger le CSV
df = pd.read_csv(
    CSV_PATH,
    encoding="utf-8",
    sep=",",
    quotechar='"',
    escapechar="\\",
    engine="python",
    on_bad_lines="skip"
)

# Nettoyer les colonnes
df.columns = df.columns.str.strip()
df.columns = df.columns.str.replace("\ufeff", "", regex=False)

# Vérifier que description_clean existe
if "description_clean" not in df.columns:
    df["description_clean"] = ""

# 🔥 Copier description_clean des lignes où il existe déjà pour le même movieId
updated_count = 0
for movie_id in df["movieId"].unique():
    # toutes les lignes pour ce movieId
    group = df[df["movieId"] == movie_id]

    # chercher une valeur description_clean non vide
    existing_desc = group["description_clean"].dropna().astype(str).str.strip()
    existing_desc = existing_desc[existing_desc != ""]

    if not existing_desc.empty:
        desc_value = existing_desc.iloc[0]  # prendre la première valeur existante
        # remplir les lignes vides
        mask = (df["movieId"] == movie_id) & (df["description_clean"].astype(str).str.strip() == "")
        df.loc[mask, "description_clean"] = desc_value
        updated_count += mask.sum()

print(f"✅ {updated_count} lignes mises à jour avec description_clean copiée")

# Sauvegarder le CSV corrigé
df.to_csv(CSV_PATH, index=False, encoding="utf-8")
print("💾 Fichier sauvegardé :", CSV_PATH)
