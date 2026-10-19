# Architecture

## Vue d'ensemble

```
private/ (poste de mise à jour, exclu de Git)
  data/*.ts            fiches structurées, sourcées document + page
  documents/           originaux
  manifest.json        métadonnées des documents
  knowledge/           texte extrait et passages (npm run ingest)
        │
        │  npm run seal  (mot de passe)
        ▼
public/vault/ (versionné, chiffré)
  meta.json            sel et itérations
  <aléatoire>.bin      données + base documentaire (JSON compressé)
  <aléatoire>.bin      archive des sources éditables
  files/*.bin          originaux
        │
        │  GitHub Actions : next build (export statique) → GitHub Pages
        ▼
Navigateur
  écran de mot de passe → dérivation de la clé → déchiffrement → données en mémoire
```

## Code

- **Next.js 14 (App Router), export statique**, React 18, TypeScript, Tailwind, police Inter.
- `src/lib/crypto.ts` : chiffrement commun au navigateur et à Node (Web Crypto).
- `src/lib/vault.ts` : ouverture du coffre dans le navigateur, session, ouverture des originaux.
- `src/data/store.ts` : données vides au chargement, remplies par `hydrate()` après déchiffrement. Les modules `src/data/*.ts` en réexportent les valeurs.
- `src/components/VaultGate.tsx` : écran de connexion ; aucune page n'est rendue avant le déchiffrement.
- `src/lib/search.ts` : recherche BM25 locale (accents, racinisation FR/EN, mots vides FR/EN/NL, lexique métier, pondération par nature de document, quotas par proposition).
- `scripts/ingest.py` : extraction page par page (PDF), diapositive (PPTX), onglet (XLSX), section (DOCX) ; dédoublonnage ; exclusions déclarées dans le manifeste.
- `scripts/seal.ts` / `scripts/unseal.ts` : chiffrement et restauration. Les originaux inchangés gardent leur fichier chiffré, pour ne pas alourdir le dépôt.
- `scripts/check-public.ts` : contrôle qu'aucun contenu sensible n'apparaît en clair.

## Neutralité dans l'interface

- Ordre fixe des propositions, celui du dossier d'évaluation.
- Statuts du comparateur décrits par des formes et des libellés (prévu, partiel, exclu, non précisé), sans code rouge / vert.
- « Non précisé » signale une absence d'information dans les documents, pas une absence de fonctionnalité.
- Aucun total ni compteur qui suggérerait un classement ; les totaux financiers sont accompagnés de leurs exclusions et des avertissements de comparabilité.

## Tests

- `tests/` (publics) : chiffrement, et absence de contenu lisible dans le coffre.
- `private/tests/` (chiffrés avec les sources) : chaque référence pointe vers une page existante, montants vérifiés dans les pages citées, totaux conformes au dossier d'évaluation, qualité de la recherche, correspondance coffre / sources.
