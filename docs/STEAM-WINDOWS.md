# Paquet Windows de Shadow Mandate pour Steam

Le dossier `resources/app` contient les sources de l’édition PC hors ligne chargées par `Shadow Mandate.exe`. Le paquet Steam utilise ces sources et la version d’Electron déclarée dans le projet. Les deux langues sont incluses dans le même dépôt Windows x64.

## Construire le dépôt

Depuis la racine du projet sous Windows x64 avec Node.js 22 ou plus récent, installer les dépendances avec `npm ci`, puis lancer ces commandes.

```powershell
npm test
npm run test:pc
npm run build:steam
```

La commande imprime le chemin du nouveau dossier sous `release/steam-windows-x64-<build>-…`. Le dossier `content` contient les fichiers à distribuer. `manifest.json` contient leur taille et leur SHA-256. Les fichiers de configuration SteamPipe sont dans `scripts`.

## Configurer SteamPipe

Dans Steamworks, définir un dépôt Windows x64 commun aux deux langues et une option de lancement Windows qui pointe vers `Shadow Mandate.exe`. Avec les identifiants numériques de l’application et du dépôt, générer les configurations de prévisualisation et de téléversement.

```powershell
$steamAppId = Read-Host 'App ID'
$steamDepotId = Read-Host 'Windows Depot ID'
node scripts/build-steam.mjs --app-id $steamAppId --depot-id $steamDepotId
```

Utiliser `app_build_preview.vdf` avec SteamCMD pour vérifier la sélection de fichiers. `app_build.vdf` sert au téléversement. Ensuite, sélectionner le build sur une branche privée dans Steamworks et tester un téléchargement sur un compte Windows neuf. Vérifier le lancement depuis la bibliothèque, le choix Français / English, l’enregistrement, la reprise et la commande Quitter. [Documentation SteamPipe](https://partner.steamgames.com/doc/sdk/uploading)

## Sauvegardes

L’écran Sauvegardes contient quatre emplacements. Le jeu enregistre le tour dans l’emplacement actif et garde une copie de récupération. Le premier emplacement utilise `campaign.json` et `campaign.previous.json` dans `%LOCALAPPDATA%\Shadow Mandate\saves`. Les trois autres utilisent les sous-dossiers `slot-2`, `slot-3` et `slot-4`. Les fichiers de campagne restent dans le profil Windows pendant les mises à jour du dépôt.
