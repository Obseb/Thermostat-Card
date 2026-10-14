# Obs Thermostat Card

Carte thermostat pour Home Assistant (entités `climate`), inspirée de [spencersmb/honeywell-smb-card](https://github.com/spencersmb/honeywell-smb-card) :

- température actuelle en grand, colorée selon le mode (chauffage, clim, auto, off) ;
- consigne avec boutons **+ / −** (envoi différé de 0,9 s pour éviter de spammer l'API) ;
- état en cours (Chauffe, Inactif, …) ;
- boutons de mode (chauffage, auto, clim, off…) construits à partir des `hvac_modes` de l'entité ;
- menu déroulant des préréglages (`preset_modes`) ;
- mode `heat_cool` : deux consignes (basse / haute) ;
- icône ⚙ qui ouvre la fenêtre « plus d'infos » de l'entité ;
- éditeur visuel, textes en français ou anglais selon la langue de Home Assistant.

## Installation via HACS

1. HACS → ⋮ → **Dépôts personnalisés**.
2. Ajoute l'URL de ton dépôt GitHub, catégorie **Dashboard** (ou « Lovelace » selon la version).
3. Installe **Obs Thermostat Card**, puis recharge le navigateur (Ctrl+F5).

Si la ressource n'est pas ajoutée automatiquement : *Paramètres → Tableaux de bord → ⋮ → Ressources* → ajoute
`/hacsfiles/obs-thermostat-card/obs-thermostat-card.js` (type **Module JavaScript**).

## Installation manuelle

Copie `dist/obs-thermostat-card.js` dans `/config/www/` et ajoute la ressource `/local/obs-thermostat-card.js` (Module JavaScript).

## Configuration

```yaml
type: custom:obs-thermostat-card
entity: climate.main_floor
name: Main Floor
```

| Option          | Type    | Défaut         | Description                                         |
|-----------------|---------|----------------|-----------------------------------------------------|
| `entity`        | string  | **requis**     | Entité `climate.xxx`                                |
| `name`          | string  | nom de l'entité| Titre de la carte                                   |
| `step`          | number  | auto           | Pas de la consigne (1 en °F, 0,5 en °C par défaut)  |
| `show_modes`    | boolean | `true`         | Affiche les boutons de mode                         |
| `show_mode_title` | boolean | `false`      | Affiche le titre « Mode » au-dessus des boutons     |
| `modes`         | liste   | tous           | Limite/ordonne les modes affichés, ex. `[heat, off]`|
| `show_presets`  | boolean | `true`         | Affiche le menu de préréglages                      |
| `show_settings` | boolean | `true`         | Affiche l'icône ⚙                                   |

### Personnalisation du thème

Variables CSS utilisables (ex. avec card-mod) : `--htc-card-bg`, `--htc-tile-bg`.

## Publier sur GitHub pour HACS

```bash
git init
git add .
git commit -m "Première version"
git branch -M main
git remote add origin https://github.com/<ton-user>/obs-thermostat-card.git
git push -u origin main
```

Puis crée une **release** (ex. `v1.0.0`) sur GitHub : HACS s'en sert pour les versions. Le workflow `.github/workflows/validate.yml` vérifie la structure du dépôt.
