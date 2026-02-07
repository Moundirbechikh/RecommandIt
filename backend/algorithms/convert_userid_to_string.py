# backend/algorithms/convert_userid_to_string.py
import pandas as pd
from pathlib import Path

SRC = Path("backend/movies_enriched.csv")
BACKUP = Path("backend/movies_enriched.backup.csv")
OUT = Path("backend/movies_enriched.csv")  # écrase le fichier d'origine

if not SRC.exists():
    raise SystemExit(f"CSV introuvable: {SRC}")

# sauvegarde
SRC.replace(BACKUP)
print(f"Sauvegarde créée: {BACKUP}")

# lecture en forçant toutes les colonnes en string pour éviter conversion automatique
df = pd.read_csv(BACKUP, dtype=str, on_bad_lines="skip")

# nettoyage basique : strip espaces et enlever suffixe .0 si présent (ex: "111.0")
df["userId"] = df["userId"].astype(str).str.strip().replace(r"\.0$", "", regex=True)

# optionnel : si tu veux forcer l'unicité ou détecter doublons
dups = df["userId"].duplicated().sum()
print(f"Lignes totales: {len(df)}, doublons userId: {dups}")

# écrire en conservant les chaînes (quoting pour forcer guillemets si besoin)
import csv
df.to_csv(OUT, index=False, quoting=csv.QUOTE_MINIMAL, encoding="utf-8")
print(f"Fichier réécrit avec userId en string: {OUT}")
