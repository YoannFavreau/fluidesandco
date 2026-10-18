# Fluides & Co – site vitrine

Site statique : une page HTML par route, aucun serveur, aucune installation pour le consulter. Ouvrir `index.html` dans un navigateur, ou déposer le dossier tel quel chez un hébergeur (Netlify, Cloudflare Pages, OVH, etc.).

## Structure

```
index.html                                  /                              Accueil
particuliers/index.html                     /particuliers/
particuliers/plomberie/index.html           /particuliers/plomberie/
particuliers/chauffage/index.html           /particuliers/chauffage/
particuliers/climatisation/index.html       /particuliers/climatisation/
professionnels/index.html                   /professionnels/
qui-suis-je/index.html                      /qui-suis-je/
contact/index.html                          /contact/
mentions-legales/index.html                 /mentions-legales/             page statique à compléter (voir plus bas)
css/styles.css            tous les styles (mobile first, mode sombre, page Professionnels)
js/app.js                 contenus, navigation, carte, accordéon, formulaire
assets/fonts/             Roboto (normale + italique) et Kripa, en woff2, hébergées ici
assets/img/               logo, photo de Maxime, photos des réalisations, logo Travaux.com
sitemap.xml, robots.txt   référencement (domaine à renseigner)
build/                    script de génération des pages (voir plus bas)
```

Chaque page est un dossier contenant un `index.html` : l'adresse s'affiche sans « .html » (`/particuliers/plomberie/`). Les chemins sont relatifs, donc le site fonctionne aussi bien déposé chez un hébergeur qu'ouvert en double-cliquant sur `index.html` depuis l'ordinateur (dans ce cas les liens ajoutent `index.html` automatiquement).

Chaque fichier contient déjà son contenu (titre, description, textes, FAQ, fil d'Ariane, données structurées) : il est lisible sans JavaScript par les moteurs de recherche et les IA. Les polices ne dépendent plus de Google Fonts.

## Angles coupés

Tous les arrondis ont été remplacés par des angles coupés (octogones pour les repères de la carte). La taille de la coupe se règle avec la variable `--c` dans le bloc « Angles coupés » à la fin de `css/styles.css` (par exemple `.card{--c:14px}` ; `0px` donne un angle droit). Les ombres portées sont retirées des éléments coupés, car une coupe les rogne : la bordure et la couleur de fond les remplacent.

## Où modifier quoi (dans `js/app.js`)

- Téléphone et email : constantes `TEL`, `TELH`, `MAIL` en haut du fichier
- Fiche Travaux.com : `TRAVAUX_URL`
- Titres et descriptions de chaque page : objet `META`
- Réalisations (titre, commune, texte, photo) : tableaux `R` et `LOC`
- Avis Travaux.com : fichier `js/avis.js` (un bloc par avis, mode d'emploi en tête du fichier)
- Certifications : tableau `CERTS` (logos à ajouter dans `assets/img/`)
- Parcours : tableau `PARC`
- Villes du bandeau : `MQ1` et `MQ2`
- Questions fréquentes de chaque page : objet `FAQS`

Après une modification de `js/app.js`, le navigateur affiche tout de suite le nouveau contenu. Pour que les **moteurs de recherche et les IA** le voient aussi, il faut régénérer les pages :

```
cd build
npm install     # une seule fois
npm run build
```

Le script recrée chaque `index.html` à partir de `build/shell.html` (l'en-tête, le pied de page et la barre du bas communs à toutes les pages), l'ouvre dans un navigateur et enregistre la page complète. Il demande Node.js. Pour changer le menu, l'en-tête ou le pied de page, modifier `build/shell.html` (et le tableau `NAV` dans `js/app.js` pour le menu), puis relancer.

**Ajouter une page** (par exemple une page par ville) : ajouter une ligne dans `PAGES` de `build/build.mjs`, un contenu dans `js/app.js` (`META`, `PATH`, `DIR`, `CRUMBS`), et l'adresse dans `sitemap.xml`.

## Mentions légales (à compléter)

`mentions-legales/index.html` est un fichier HTML ordinaire, à modifier directement : le texte contient des champs surlignés en jaune « À COMPLÉTER » (forme juridique, numéro RM ou RCS, TVA, adresse, hébergeur, assurances décennale et RC pro, médiateur, durée de conservation des données, date). Une fois rempli, supprimer le bloc jaune « Page à compléter ». C'est un modèle de départ : à faire relire (CMA, expert-comptable ou juriste). Le build ne modifie que son menu.

## Avant la mise en ligne

1. **Formulaire** : renseigner `FORM_ENDPOINT` dans `js/app.js` (service type Formspree ou Web3Forms) pour que les demandes partent réellement. Sans cela, le formulaire ouvre la messagerie du visiteur. Si un service est utilisé, le citer dans les mentions légales.
2. **Domaine** : remplacer `VOTRE-DOMAINE.fr` dans `sitemap.xml` et `robots.txt`, puis déclarer le sitemap dans la Search Console. Renseigner aussi la constante `SITE` en haut de `js/app.js` (par exemple `https://www.fluides-and-co.fr`, sans « / » final) et relancer le build : chaque page reçoit alors sa balise `canonical` et son `og:url`, et le fil d'Ariane devient complet pour Google.
   Si le site est publié avant que l'adresse soit figée, ne changez plus la structure des dossiers ensuite, ou prévoyez des redirections.
3. **À confirmer avec Maxime** : certifications (badges « À confirmer »), parcours (« À compléter »), communes réelles des chantiers, liste des villes du bandeau.
4. **Licences des polices** : vérifier les conditions d'utilisation de Kripa et de Roboto pour un usage web.


## Référencement (SEO) et IA (GEO) : réglages à faire une fois

Ouvrir `build/site.config.json` et renseigner :

```json
{
  "site": "https://www.votre-domaine.fr",
  "facebook": "https://www.facebook.com/votre-page"
}
```

Puis, depuis le dossier `build/` : `npm install` (la première fois) puis `npm run build`.

Le build met alors à jour, sur toutes les pages : la balise canonique, `hreflang`, les images de partage (Facebook, LinkedIn, X), les données structurées schema.org (entreprise, services, pages, avis, FAQ, fil d'Ariane, liens `sameAs` vers Facebook et Travaux.com) et le pied de page (téléphone, e-mail, Facebook). Il recrée aussi `sitemap.xml` (avec la date), `robots.txt` (moteurs de recherche et assistants IA autorisés) et `llms.txt` (résumé du site pour les IA).

Tant que `site` est vide, ces éléments restent en mode « à compléter ». Laisser `facebook` vide masque simplement le lien.

Après la mise en ligne : déclarer le site dans Google Search Console (envoyer `sitemap.xml`), et vérifier la fiche Google Business Profile avec le même nom, adresse et téléphone que dans le pied de page.

## Logo et icônes

- `assets/img/logo-fluides-co.png` : logo noir (en-tête, il s'inverse tout seul en mode sombre) ; `logo-fluides-co-blanc.png` : version blanche
- `favicon.ico`, `apple-touch-icon.png`, `assets/img/icon-192.png`, `icon-512.png`, `site.webmanifest` : icône « F » blanche sur fond vert (onglet du navigateur, résultats Google, écran d'accueil du téléphone)
- `assets/img/og-default.png` : image de partage par défaut (Facebook, LinkedIn)
Pour changer de logo, remplacer ces fichiers en gardant les mêmes noms, puis relancer le build.
