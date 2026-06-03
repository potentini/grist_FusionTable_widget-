# Grist Planning Items Sync Widget

Widget Grist statique qui lit trois niveaux de planification (`Projets`, `Taches`, `Sous_taches`) et alimente une table de synthèse `Planning_Items` destinée à un widget Gantt/timeline.

## Fonctionnalités

- Lit toutes les lignes des tables source configurées.
- Crée `Planning_Items` si la table n'existe pas encore.
- Crée ou met à jour les lignes de synthèse par clé stable `Item_Key`.
- Conserve les champs hiérarchiques : `Item_Key`, `Parent_Key`, `Level`, `Source_Table`, `Source_Record_ID`.
- Expose les champs timeline : `level1Name`, `levelNName`, `levelNStart`, `levelNEnd`, `levelNStatus`, `levelNResponsible`, `levelNProgress` pour N = 1, 2, 3.

## Installation

1. Publiez `index.html`, `styles.css` et `app.js` sur un hébergement accessible par Grist (GitHub Pages, serveur interne, etc.).
2. Dans Grist, ajoutez un widget personnalisé pointant vers l'URL publiée.
3. Accordez l'accès complet demandé par le widget : il doit lire les tables source et écrire dans `Planning_Items`.
4. Cliquez sur **Synchroniser maintenant**.

## Tables attendues par défaut

| Niveau | Table | Parent attendu |
| --- | --- | --- |
| 1 | `Projets` | Aucun |
| 2 | `Taches` | Colonne référence vers `Projets` parmi `Projet`, `Projet_ID`, `Project`, `Parent`, `Parent_ID` |
| 3 | `Sous_taches` | Colonne référence vers `Taches` parmi `Tache`, `Tâche`, `Tache_ID`, `Task`, `Parent`, `Parent_ID` |

Les champs métier sont détectés à partir de listes de noms courants dans `DEFAULT_CONFIG` (`Nom`, `Date_debut`, `Date_fin`, `Statut`, `Responsable`, `Avancement`, etc.). Adaptez les options du widget si votre document utilise d'autres noms.

## Schéma `Planning_Items`

Le widget crée les colonnes nécessaires au Gantt et au widget timeline :

- `Item_Key`, `Parent_Key`, `Level`, `Source_Table`, `Source_Record_ID`
- `Name`, `Start`, `End`, `Status`, `Responsible`, `Progress`
- `level1Name`, `level2Name`, `level3Name`
- `levelNStart`, `levelNEnd`, `levelNStatus`, `levelNResponsible`, `levelNProgress` pour N = 1, 2, 3
- `Updated_At`

## Configuration avancée

Dans les options JSON du widget Grist, vous pouvez remplacer `sources` pour pointer vers `Niveau1`, `Niveau2`, `Niveau3` ou vers d'autres noms de colonnes. Exemple :

```json
{
  "sources": [
    {
      "tableId": "Niveau1",
      "level": 1,
      "keyPrefix": "N1",
      "parent": null,
      "fields": {
        "name": ["Nom"],
        "start": ["Debut"],
        "end": ["Fin"],
        "status": ["Statut"],
        "responsible": ["Responsable"],
        "progress": ["Avancement"]
      }
    }
  ]
}
```

Ajoutez les définitions des niveaux 2 et 3 sur le même modèle en renseignant `parent`.
