from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import numpy as np

# === Données initiales ===
films = {
    'title': ['Vice-Versa', 'Les Minions', 'Ant-Man', "L’Ère d’Ultron", 'Soul'],
    'desc': [
        "film animation émotions famille psychologie",
        "animation comédie aventures méchants amusants",
        "super-héros action humour science",
        "super-héros robots action marvel",
        "musique émotions voyage intérieur animation"
    ]
}

df = pd.DataFrame(films)
print("🎬 === Catalogue de films ===")
print(df, "\n")

# === Étape 1 : Extraction des mots-clés (vocabulaire) ===
count_vect = CountVectorizer()
tf_matrix = count_vect.fit_transform(df['desc'])
vocabulaire = count_vect.get_feature_names_out()

print("🗝️ === Mots-clés trouvés (vocabulaire global) ===")
print(", ".join(vocabulaire), "\n")

# === Étape 2 : Matrice TF (fréquences brutes) ===
tf_df = pd.DataFrame(tf_matrix.toarray(), columns=vocabulaire, index=df['title'])
print("🧮 === Matrice TF (Term Frequency) ===")
print(tf_df, "\n")

# === Étape 3 : Calcul des valeurs IDF ===
tfidf_vect = TfidfVectorizer()
tfidf_vect.fit(df['desc'])
idf_values = dict(zip(tfidf_vect.get_feature_names_out(), tfidf_vect.idf_))
idf_df = pd.DataFrame(idf_values.items(), columns=['Mot', 'IDF']).sort_values(by='IDF', ascending=False)
print("📘 === Valeurs IDF (rareté des mots) ===")
print(idf_df.round(3), "\n")

# === Étape 4 : Matrice TF-IDF ===
tfidf_matrix = tfidf_vect.transform(df['desc'])
tfidf_df = pd.DataFrame(tfidf_matrix.toarray(), columns=tfidf_vect.get_feature_names_out(), index=df['title'])
print("📊 === Matrice TF-IDF ===")
print(tfidf_df.round(3), "\n")

# === ✅ Afficher les 5 mots-clés les plus importants par film ===
print("🏆 === Top 5 mots-clés les plus importants (TF-IDF) pour chaque film ===\n")
for film in tfidf_df.index:
    top_keywords = tfidf_df.loc[film].sort_values(ascending=False).head(5)
    print(f"🎬 {film}:")
    for mot, poids in top_keywords.items():
        print(f"   - {mot}: {poids:.3f}")
    print()

# === Étape 5 : Matrice de similarité cosinus ===
cosine_sim = cosine_similarity(tfidf_matrix)
cosine_df = pd.DataFrame(cosine_sim, index=df['title'], columns=df['title'])
print("🤝 === Matrice de similarité cosinus ===")
print(cosine_df.round(3), "\n")

# === Étape 6 : Recommandation automatique ===
def recommander_film(titre, df, cosine_df):
    if titre not in df['title'].values:
        print("❌ Ce film n'existe pas dans la base.")
        return

    similarites = cosine_df[titre].sort_values(ascending=False)
    print(f"\n🎯 Si vous avez aimé '{titre}', voici les films les plus proches :\n")
    for film, score in similarites.iloc[1:].items():
        print(f"👉 {film} (similarité = {score:.3f})")

# Exemple d’utilisation :
recommander_film("Ant-Man", df, cosine_df)
