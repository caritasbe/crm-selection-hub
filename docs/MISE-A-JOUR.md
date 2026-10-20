# Mettre à jour le dossier

Prérequis : Node 20 ou plus et le mot de passe. Pour ajouter des documents : Python 3 avec `python-docx`, `python-pptx`, `openpyxl`, poppler (`pdftotext`, `pdftoppm`) et LibreOffice (conversion en PDF des fichiers Office pour l'affichage dans la bibliothèque).

## 1. Récupérer les données en clair

```bash
git clone <dépôt> && cd <dépôt>
npm ci
VAULT_PASSWORD='…' npm run unseal
```

Les données sont restaurées dans `private/`, dossier exclu de Git.

## 2. Modifier

- **Fiches, comparateur, finances, questions** : `private/data/*.ts`. Chaque information garde ses sources (`{ doc, page }`).
- **Nouveau document** : le déposer dans `private/documents/…`, l'ajouter à `private/manifest.json`, puis `npm run ingest` (texte, index de recherche, version PDF d'affichage et vignette).

## Version anglaise

Les textes de l'interface sont traduits dans `src/lib/i18n-en.ts` (aucune donnée du dossier). Les contenus du dossier (fiches, comparateur, questions, finances, titres et descriptions des documents) sont traduits dans `private/i18n/en.json`, chiffré avec le reste.

Après toute modification d'un texte dans `private/data` ou `private/manifest.json` :

```bash
npm run i18n:check   # liste les textes sans traduction dans private/i18n/missing.json
```

Ajouter les traductions manquantes dans `private/i18n/en.json` (clé : texte français exact). Un texte non traduit s'affiche en français dans la version anglaise. Le contenu des documents eux-mêmes reste dans sa langue d'origine.

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
