# Grist Planning Items Sync Widget

Widget Grist statique qui lit trois niveaux de planification (`Niveau1`, `Niveau2`, `Niveau3`) et alimente une table de synthèse `Planning_Items` destinée à un widget Gantt/timeline.

## Fonctionnalités

- Lit toutes les lignes des tables source configurées.
- Crée `Planning_Items` si la table n'existe pas encore.
- Crée ou met à jour les lignes de synthèse par clé stable `Item_Key`.
- Conserve les champs hiérarchiques : `Item_Key`, `Parent_Key`, `Level`, `Source_Table`, `Source_Record_ID`.
- Expose les champs timeline : `level1Name`, `levelNName`, `levelNStart`, `levelNEnd`, `levelNStatus`, `levelNResponsible`, `levelNProgress` pour N = 1, 2, 3.

## Installation

1. Publiez `index.html`, `styles.css` et `app.js` sur un hébergement accessible par Grist (GitHub Pages, serveur interne, etc.).
2. Dans Grist, ajoutez un widget personnalisé pointant vers l'URL publiée.
3. Connectez cette première instance du widget à la table `Niveau1` (racine hiérarchique). Le widget utilise toutefois l'API document pour lire aussi `Niveau2` et `Niveau3`.
4. Accordez l'accès complet demandé par le widget : il doit lire les tables source et écrire dans `Planning_Items`.
5. Cliquez sur **Synchroniser maintenant**.

## Tables attendues par défaut

| Niveau | Table | Parent attendu | Champs lus par défaut |
| --- | --- | --- | --- |
| 1 | `Niveau1` | Aucun | `Projet`, `DateDebut_Prj`, `DateFin_Prj`, `Statut_Prj`, `Responsable_Prj`, `Progression_Prj` |
| 2 | `Niveau2` | Colonne référence `Projet` vers `Niveau1` | `Tache`, `DateDebut_Tache`, `DateFin_Tache`, `Statut_Tache`, `Avancement_Tache` |
| 3 | `Niveau3` | Colonne référence `Tache` vers `Niveau2` | `Sous_Tache`, `DateDebut_ST`, `DateFin_ST`, `Statut_ST`, `Responsable_ST` |

Les champs métier par défaut correspondent aux classes Python Grist `Niveau1`, `Niveau2` et `Niveau3` du document. Adaptez les options du widget si votre document utilise d'autres noms.

## Schéma `Planning_Items`

Le widget crée les colonnes nécessaires au Gantt et au widget timeline :

- `Item_Key`, `Parent_Key`, `Level`, `Source_Table`, `Source_Record_ID`
- `Name`, `Start`, `End`, `Status`, `Responsible`, `Progress`
- `level1Name`, `level2Name`, `level3Name`
- `levelNStart`, `levelNEnd`, `levelNStatus`, `levelNResponsible`, `levelNProgress` pour N = 1, 2, 3
- `Updated_At`

## Configuration avancée

Dans les options JSON du widget Grist, vous pouvez remplacer `sources` si les noms de tables ou de colonnes changent. Exemple minimal pour le niveau 1 :

```json
{
  "sources": [
    {
      "tableId": "Niveau1",
      "level": 1,
      "keyPrefix": "N1",
      "parent": null,
      "fields": {
        "name": ["Projet"],
        "start": ["DateDebut_Prj"],
        "end": ["DateFin_Prj"],
        "status": ["Statut_Prj"],
        "responsible": ["Responsable_Prj"],
        "progress": ["Progression_Prj"]
      }
    }
  ]
}
```

Ajoutez les définitions des niveaux 2 et 3 sur le même modèle en renseignant `parent`.
