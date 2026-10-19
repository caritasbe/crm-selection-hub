# Sécurité et confidentialité

## Modèle

Le site est public au sens réseau (une adresse GitHub Pages), mais **son contenu est chiffré**. Ce n'est pas une adresse cachée : quiconque peut télécharger les fichiers du coffre, et personne ne peut les lire sans le mot de passe.

| Élément | Où | Protection |
|---|---|---|
| Fiches, montants, questions, textes des documents | `public/vault/<aléatoire>.bin` | AES-256-GCM |
| Originaux (PDF, Office) | `public/vault/files/*.bin` | AES-256-GCM, un fichier par document |
| Sources éditables (`private/data`, manifeste) | `public/vault/<aléatoire>.bin` | AES-256-GCM |
| Paramètres de dérivation (sel, itérations) | `public/vault/meta.json` | Non secrets |
| Mot de passe | Nulle part | Communiqué aux membres hors de GitHub |
| Données en clair | `private/` sur le poste de mise à jour | Exclu de Git (`.gitignore`) |

- **Dérivation** : PBKDF2-SHA256, 600 000 itérations, sel aléatoire de 16 octets. Chaque essai de mot de passe coûte donc cher, y compris hors ligne.
- **Mot de passe** : 20 caractères aléatoires (environ 99 bits d'entropie). Une attaque par force brute n'est pas réaliste. Ne pas le remplacer par un mot de passe court ou devinable.
- **Intégrité** : le chiffrement authentifié (GCM) détecte toute altération d'un fichier.
- **Code publié** : il ne contient aucune donnée du dossier. Les noms des propositions eux-mêmes ne sont lisibles qu'après déchiffrement. `npm run check` bloque la publication si un montant ou un nom sensible apparaît en clair.
- **Session** : la clé dérivée est gardée dans l'onglet (sessionStorage). Avec « Rester connecté », elle est aussi conservée sur l'appareil (localStorage) jusqu'au clic sur « Verrouiller ».
- **Originaux** : déchiffrés en mémoire dans le navigateur, ouverts via une adresse locale `blob:` ; rien n'est envoyé ailleurs.

## Limites, à connaître

- **Un seul mot de passe partagé** : pas de compte individuel ni de journal d'accès. Toute personne qui obtient le mot de passe et l'adresse peut lire le dossier.
- **Révocation** : pour retirer l'accès à quelqu'un, il faut changer le mot de passe (`VAULT_NEW_PASSWORD=1 npm run seal`) et le communiquer aux autres membres. Les anciennes versions chiffrées restent dans l'historique Git, toujours protégées par l'ancien mot de passe.
- **Appareil** : une fois le dossier ouvert, son contenu est affiché dans le navigateur ; un appareil compromis ou partagé reste un risque.
- **Pas d'assistant IA** : un assistant conversationnel nécessiterait un serveur pour protéger une clé d'API. Il n'est pas inclus ; l'Explorer cite les passages tels quels.

## Bonnes pratiques

- Communiquer le mot de passe par un canal distinct de l'adresse du site (par exemple oralement ou par Teams, pas dans le même e-mail).
- Ne pas cocher « Rester connecté » sur un poste partagé.
- Garder le dépôt GitHub privé autant que possible.
