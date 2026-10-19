# CARITAS · CRM Selection Hub

Espace de consultation du comité de sélection CRM & Marketing Automation de Caritas International Belgium.

Le comité y explore les propositions reçues, les compare sur les dimensions de son choix, parcourt les documents et remonte à chaque source. **L'outil ne recommande aucune solution, n'établit aucun classement et ne crée aucune note.** Le dossier d'évaluation reste la référence du comité.

## Fonctionnalités

| Section | Contenu |
|---|---|
| Accueil | Contexte du projet, propositions, dimensions d'évaluation, sujets ouverts, calendrier, validité des offres |
| Explorer | Recherche d'un sujet dans tout le dossier, passages côte à côte par proposition, liens vers le comparateur et les questions ouvertes |
| Propositions | Une fiche complète par offre : composants, périmètre, architecture, intégrations, finances, mise en œuvre, contrat, limites, fiche technique, questions, documents |
| Comparateur | Vue d'ensemble interactive, comparatif détaillé avec justifications et sources |
| Finances | Coût sur 3 ans selon la formule du dossier d'évaluation, HTVA / TVAC, curseurs (accompagnement récurrent, fourchette de mise en œuvre), exclusions, avertissements de comparabilité |
| Questions ouvertes | Points sourcés, filtrables par proposition, thème et type |
| Bibliothèque | Documents de référence, recherche plein texte, visionneuse page par page, ouverture des originaux |
| Méthode | Étapes, critères, pondérations, gouvernance |

Navigation rapide partout : `Ctrl` + `K` (ou `/`). Bascule français / anglais (bouton FR / EN). Visite guidée interactive au premier accès, relançable par le bouton « Tutoriel ».

## Fonctionnement : un site statique chiffré

Le site est publié par **GitHub Pages**, sans serveur. Toutes les données du dossier (fiches, montants, texte et originaux des documents) sont **chiffrées** dans `public/vault/` :

- chiffrement AES-256-GCM, clé dérivée du mot de passe par PBKDF2-SHA256 (600 000 itérations) ;
- le mot de passe n'est stocké nulle part dans le dépôt ni sur le site ; il est vérifié dans le navigateur ;
- sans le mot de passe, le site n'affiche qu'un écran de connexion et le dépôt ne contient que des fichiers illisibles ;
- le code publié ne contient ni nom de proposition, ni montant, ni extrait de document (`npm run check` le vérifie à chaque publication).

Détails : [`docs/SECURITE.md`](docs/SECURITE.md) · architecture : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Publication

Le workflow `.github/workflows/pages.yml` construit et publie le site à chaque modification de `main`.
Réglage unique dans GitHub : **Settings > Pages > Source : GitHub Actions**.

## Mettre à jour le contenu

Voir [`docs/MISE-A-JOUR.md`](docs/MISE-A-JOUR.md). En résumé, sur un poste avec Node 20+ et le mot de passe :

```bash
npm ci
VAULT_PASSWORD='…' npm run unseal   # restaure les données en clair dans private/ (exclu de Git)
# modifier private/data/*.ts, ou ajouter un document dans private/documents + private/manifest.json puis : npm run ingest
VAULT_PASSWORD='…' npm test         # vérifie sources, montants et coffre
VAULT_PASSWORD='…' npm run seal     # rechiffre vers public/vault/
npm run build && npm run check      # aucun contenu en clair dans le site ni dans le dépôt
git add -A && git commit -m "Mise à jour du dossier" && git push
```

## Développement local

```bash
npm ci
npm run dev          # http://localhost:3000, puis saisir le mot de passe
```
