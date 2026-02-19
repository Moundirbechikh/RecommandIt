# 1. Utiliser une image Python officielle légère
FROM python:3.11-slim

# 2. Définir le dossier de travail
WORKDIR /app

# 3. Copier requirements.txt et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Télécharger le modèle spaCy français (fr_core_news_sm) 

RUN python -m spacy download fr_core_news_sm

# 4. Copier tout ton code dans le conteneur
COPY . .

# 5. Définir la variable d'environnement PORT (Cloud Run utilise 8080 par défaut)
ENV PORT=8080

# 6. Lancer ton API FastAPI avec uvicorn
CMD ["uvicorn", "API:app", "--host", "0.0.0.0", "--port", "8080"]
