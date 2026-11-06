# Build 222 — Cellules et extraction neutre

Nouvelles parties régulières et avancées : sélection de trois cellules sur quatre, activée en solo et dans les salons multijoueurs. Les anciennes sauvegardes, le mode coopératif et les tutoriels conservent leurs règles.

Éclipse : +20 crise à chaque enlèvement réussi ; agent neutre dans le pays visé ; +3 par fin de tour et par captif dès la capture. L’action existante « Extraire un agent » permet à tous les pays de tenter sa libération. Une réussite rapporte une seule fois 2 points au pays libérateur et réduit la crise de 10. Aucun recrutement.

Bilan : colonnes agents neutres libérés et points de libération, catégorie dédiée dans l’origine du prestige. Les points proviennent du registre d’attribution ; les missions interrompues ou échouées ne comptent pas.

Validation : suite complète npm test ; tests ciblés couvrant cumul de captifs, protection, sauvegarde, extraction concurrente, attribution unique, bilan et activation sans paramètre expérimental. Les scénarios historiques du tutoriel sont explicitement exclus du nouveau tirage.

Équilibrage : 800 simulations BB2 du prototype, résultats dans benchmarks/cell-variants.json. Base : 46 % → 43,5 % de victoires. Avancé : 49 % → 44 %. 203 captures et 127 libérations. Ces résultats précèdent l’activation par défaut et l’ajout des colonnes de bilan ; ils ne constituent pas un nouveau benchmark de publication.
