# NIGHTWARD : application Android

Ce dossier contient le projet complet de l'application. Un robot (GitHub Actions) fabrique l'APK pour toi,
sans que tu aies besoin d'installer Android Studio.

## Obtenir ton APK (environ 15 minutes la première fois)

### Étape 1 : créer un compte GitHub (gratuit)
Va sur github.com, clique sur « Sign up » et crée un compte.

### Étape 2 : créer un dépôt
1. Clique sur le « + » en haut à droite, puis « New repository ».
2. Nom : `nightward-app`. Laisse « Public » ou choisis « Private ».
3. Clique sur « Create repository ».

### Étape 3 : envoyer le projet
1. Extrais `nightward-app.zip` (clic droit, « Extraire tout »).
2. Sur la page de ton dépôt, clique sur « uploading an existing file ».
3. Ouvre le dossier extrait, sélectionne TOUT son contenu (Ctrl+A) : `www`, `assets`, `.github`,
   `package.json`, `capacitor.config.json`, `.gitignore`, `LISEZ-MOI.md`.
4. Glisse la sélection dans la page GitHub et attends la fin du chargement.
5. Clique sur « Commit changes ».

Si le dossier `.github` n'apparaît pas dans ton explorateur, active « Éléments masqués » (onglet Affichage).
Si GitHub refuse le dossier `.github`, crée le fichier à la main : « Add file » puis « Create new file »,
tape le nom `.github/workflows/android.yml` et colle le contenu du fichier du même nom.

### Étape 4 : laisser le robot fabriquer l'APK
1. Clique sur l'onglet « Actions » de ton dépôt.
2. Tu vois « Build Android APK » en cours (point jaune). Attends 5 à 10 minutes jusqu'à la coche verte.
3. Si une croix rouge apparaît : clique dessus, copie le message d'erreur et envoie-le moi.

### Étape 5 : télécharger l'APK
1. Clique sur l'exécution terminée (coche verte).
2. En bas, section « Artifacts », clique sur `nightward-apk` : un fichier zip se télécharge.
3. Extrais-le : tu obtiens `app-debug.apk`.

### Étape 6 : installer sur ton téléphone
1. Envoie `app-debug.apk` sur ton téléphone (câble USB, Google Drive, Telegram, e-mail...).
2. Touche le fichier. Android demande d'autoriser l'installation depuis cette source : accepte.
3. Si « Play Protect » affiche un avertissement, choisis « Installer quand même ». C'est normal pour une
   application qui ne vient pas du Play Store.
4. Ouvre NIGHTWARD.

## Modifier l'application plus tard
Tout le site est dans le dossier `www`. Modifie un fichier (par exemple `www/script.js`), puis remets-le sur
GitHub (« Add file », « Upload files »). Le robot refabrique l'APK automatiquement.

## Tes liens, tes produits
- Liens Discord et Instagram : `www/index.html`, dans le pied de page (commentaires « LIEN DISCORD » et « LIEN INSTAGRAM »).
- Produits, noms et prix : `www/script.js`, liste `BASE`.
- Musique d'ambiance : `www/musique/ambiance.mp3`. Son du bouton : `www/musique/jackpot.mp3`.

## Pour publier sur le Play Store plus tard
Il faudra une version signée (fichier AAB) et un compte développeur Google. On le fera ensemble.

---

# NIGHTWARD sur iPhone (iOS)

Apple est beaucoup plus fermé qu'Android : un fichier installable doit être « signé ». Trois possibilités.

## Option 1 : gratuite, sans Mac, avec renouvellement tous les 7 jours
1. Dans ton dépôt GitHub, onglet « Actions », choisis « Build iOS (sans signature) », puis « Run workflow ».
   Attends 10 à 15 minutes jusqu'à la coche verte.
2. Télécharge l'artifact `nightward-ipa`, extrais-le : tu obtiens `NIGHTWARD.ipa`.
3. Sur ton PC Windows, installe iTunes et iCloud (versions du site d'Apple, pas du Microsoft Store),
   puis le programme gratuit Sideloadly (sideloadly.io).
4. Branche ton iPhone en USB, ouvre Sideloadly, glisse `NIGHTWARD.ipa`, saisis ton identifiant Apple et lance.
5. Sur l'iPhone : Réglages, Général, VPN et gestion de l'appareil, fais confiance à ton identifiant.
   Active aussi le « Mode développeur » (Réglages, Confidentialité et sécurité) si iOS le demande.
Limites : avec un identifiant Apple gratuit, l'app expire au bout de 7 jours (il faut la réinstaller) et tu
peux en avoir 3 maximum de ce type en même temps.

## Option 2 : durable et publiable (compte Apple Developer payant, environ 99 $ par an)
Permet l'installation sans limite de durée, TestFlight (tests pour tes amis) et l'App Store.
Il faut créer des certificats de signature : on le fait ensemble le moment venu.

## Option 3 : gratuite et immédiate, mais ce n'est pas une app des boutiques
Dans Safari : ouvre ton site en ligne, touche Partager, puis « Sur l'écran d'accueil ».
