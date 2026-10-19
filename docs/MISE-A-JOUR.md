# Mettre à jour le dossier

Prérequis : Node 20 ou plus, Python 3 avec `python-docx`, `python-pptx`, `openpyxl` et `pdftotext` (poppler) si l'on ajoute des documents, et le mot de passe.

## 1. Récupérer les données en clair

```bash
git clone <dépôt> && cd <dépôt>
npm ci
VAULT_PASSWORD='…' npm run unseal
```

Les données sont restaurées dans `private/`, dossier exclu de Git.

## 2. Modifier

- **Fiches, comparateur, finances, questions** : `private/data/*.ts`. Chaque information garde ses sources (`{ doc, page }`).
- **Nouveau document** : le déposer dans `private/documents/…`, l'ajouter à `private/manifest.json`, puis `npm run ingest`.

## 3. Vérifier, chiffrer, publier

```bash
VAULT_PASSWORD='…' npm test      # sources, montants, totaux, recherche
VAULT_PASSWORD='…' npm run seal  # rechiffre vers public/vault/
npm run build && npm run check   # rien en clair dans le site ni dans le dépôt
git add -A && git commit -m "Mise à jour du dossier" && git push
```

La publication sur GitHub Pages se fait automatiquement après le push (onglet Actions).

## Changer le mot de passe

```bash
VAULT_PASSWORD='nouveau' VAULT_NEW_PASSWORD=1 npm run seal
```

Puis publier, et communiquer le nouveau mot de passe aux membres. Les sessions ouvertes avec l'ancien sont automatiquement fermées.
