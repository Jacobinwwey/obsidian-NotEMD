![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd pour Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Lire la documentation dans d'autres langues : [Centre de Langues](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
  Amélioration des connaissances multilingues
             propulsée par l'IA
==================================================
```

Un moyen facile de créer votre propre base de connaissances !

Notemd améliore votre flux de travail Obsidian en s'intégrant à divers modèles de langage de grande taille (LLM) pour traiter vos notes multilingues, générer automatiquement des wiki-links pour les concepts clés, créer les notes de concept correspondantes, effectuer des recherches sur le web, vous aidant à construire des graphes de connaissances puissants et plus encore.

**Version :** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Table des Matières

- [Démarrage Rapide](#démarrage-rapide)
- [Support Linguistique](#support-linguistique)
- [Fonctionnalités](#fonctionnalités)
- [Guide d'installation](#installation)
- [Paramétrage](#configuration)
- [Guide d'Utilisation](#guide-dutilisation)
- [Fournisseurs LLM Supportés](#fournisseurs-llm-supportés)
- [Utilisation du Réseau et Manipulation des Données](#utilisation-du-réseau-et-manipulation-des-données)
- [Dépannage](#dépannage)
- [Contribution](#contribution)
- [Documentation du Mainteneur](#documentation-du-mainteneur)
- [Licence](#licence)

## Démarrage Rapide

1.  **Installer & Activer** : Obtenez le plugin via le magasin communautaire d'Obsidian.
2.  **Configurer le LLM** : Allez dans `Réglages -> Notemd`, sélectionnez votre fournisseur LLM (comme OpenAI ou un local comme Ollama), et entrez votre clé API/URL.
3.  **Ouvrir la barre latérale** : Cliquez sur l'icône de baguette magique Notemd dans le ruban de gauche pour ouvrir la barre latérale.
4.  **Traiter une note** : Ouvrez n'importe quelle note et cliquez sur **"Traiter le fichier (Ajouter des liens)"** dans la barre latérale pour ajouter automatiquement des `[[wiki-links]]`.
5.  **Lancer un workflow rapide** : Utilisez le bouton **"One-Click Extract"** par défaut pour enchaîner le traitement, la génération en masse et le nettoyage Mermaid en un seul clic.

C'est tout ! Explorez les réglages pour débloquer plus de fonctionnalités comme la recherche web, la traduction et la génération de contenu.

## Support Linguistique

### Contrat de Comportement Linguistique

| Aspect | Portée | Par Défaut | Notes |
|---|---|---|---|
| `Langue de l'interface` | Texte de l'interface uniquement (réglages, barre latérale, avis, dialogues) | `auto` | Suit la langue d'Obsidian ; catalogues actuels : `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Langue de sortie des tâches` | Sortie des tâches générée par LLM (liens, résumés, génération, extraction, cible de traduction) | `en` | Peut être global ou par tâche quand `Utiliser différentes langues pour les tâches` est activé. |
| `Désactiver la traduction automatique` | Les tâches non-traduction gardent le contexte original | `false` | Les tâches de `Traduction` explicites appliquent toujours la langue cible configurée. |
| `Langue de secours` | Résolution de clés d'interface manquantes | locale -> `en` | Maintient l'interface stable quand certaines clés ne sont pas traduites. |

- Les documents source maintenus sont l'anglais et le chinois simplifié, et les traductions README publiées sont liées dans l'en-tête ci-dessus.
- La couverture des locales d'interface intégrées correspond actuellement exactement au catalogue explicite du code : `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Le repli vers l'anglais reste un filet de sécurité d'implémentation, mais les surfaces visibles prises en charge sont couvertes par des tests de régression et ne devraient pas revenir silencieusement à l'anglais en usage normal.
- Plus de détails et de directives de contribution sont suivis dans le [Centre de Langues](./docs/i18n/README.md).

## Fonctionnalités

### Traitement de Documents par l'IA
- **Support Multi-LLM** : Connectez-vous à divers fournisseurs LLM cloud et locaux (voir [Fournisseurs LLM Supportés](#fournisseurs-llm-supportés)).
- **Découpage Intelligent** : Divise automatiquement les grands documents en morceaux gérables en fonction du nombre de mots pour le traitement.
- **Préservation du Contenu** : Maintient le formatage original tout en ajoutant structure et liens.
- **Suivi de la Progression** : Mises à jour en temps réel via la barre latérale Notemd ou une fenêtre de progression.
- **Opérations Annulables** : Annulez n'importe quelle tâche de traitement (individuelle ou par lot) initiée depuis la barre latérale via son bouton d'annulation dédié. Les opérations de la palette de commandes utilisent une fenêtre qui peut également être annulée.
- **Configuration Multi-Modèle** : Utilisez différents fournisseurs LLM *et* des modèles spécifiques pour différentes tâches (Ajouter des liens, Recherche, Générer un titre, Traduire) ou utilisez un seul fournisseur pour tout.
- **Appels API Stables (Logique de Réessai)** : Activez éventuellement les réessais automatiques pour les appels API LLM échoués avec un intervalle et des limites de tentatives configurables.
- **Tests de Connexion Fournisseur Résilients** : Si le premier test fournisseur rencontre une déconnexion réseau transitoire, Notemd bascule maintenant sur la séquence de réessai stable avant d'échouer, couvrant les transports compatibles OpenAI, Anthropic, Google, Azure OpenAI et Ollama.
- **Repli de Transport d'Environnement d'Exécution** : Lorsqu'une requête fournisseur de longue durée est interrompue par `requestUrl` avec des erreurs réseau transitoires telles que `ERR_CONNECTION_CLOSED`, Notemd réessaie maintenant la même tentative via un transport de repli spécifique à l'environnement avant d'entrer dans la boucle de réessai configurée : les builds de bureau utilisent Node `http/https`, tandis que les environnements non-bureau utilisent `fetch` du navigateur. Cela réduit les faux échecs sur les passerelles lentes et les proxies inverses.
- **Renforcement de la Chaîne de Requêtes Longues Stables compatible OpenAI** : En mode stable, les appels compatibles OpenAI utilisent maintenant un ordre explicite en 3 étapes pour chaque tentative : transport direct en streaming primaire, puis transport direct hors streaming, puis repli `requestUrl` (qui peut toujours passer à l'analyse en streaming si nécessaire). Cela réduit les faux négatifs où les fournisseurs complètent des réponses en mémoire tampon mais où les flux de streaming sont instables.
- **Repli de Streaming Sensible au Protocole sur toutes les API LLM** : Les tentatives de repli de longue durée passent maintenant à une analyse en streaming sensible au protocole sur chaque chemin LLM intégré, pas seulement sur les points de terminaison compatibles OpenAI. Notemd gère maintenant les réponses SSE de style OpenAI/Azure, le streaming de messages Anthropic, les réponses SSE de Google Gemini et les flux NDJSON d'Ollama sur le bureau `http/https` et le `fetch` hors bureau, et les points d'entrée directs restants de style OpenAI réutilisent ce même chemin de repli partagé.
- **Préréglages de Fournisseurs pour la Chine** : Les préréglages intégrés couvrent maintenant `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` et `SiliconFlow` en plus des fournisseurs mondiaux et locaux existants.
- **Traitement par Lot Fiable** : Logique de traitement concurrent améliorée avec des **appels API échelonnés** pour éviter les erreurs de limitation de débit et assurer des performances stables lors de gros travaux par lot. La nouvelle implémentation garantit que les tâches sont lancées à des intervalles différents plutôt que toutes en même temps.
- **Rapports de Progression Précis** : Correction d'un bug où la barre de progression pouvait rester bloquée, assurant que l'interface utilisateur reflète toujours le statut réel de l'opération.
- **Traitement par Lot Parallèle Robuste** : Résolution d'un problème où les opérations par lot parallèles s'arrêtaient prématurément, assurant que tous les fichiers sont traités de manière fiable et efficace.
- **Précision de la Barre de Progression** : Correction d'un bug où la barre de progression pour la commande "Créer un wiki-link & Générer une note" restait bloquée à 95%, assurant qu'elle affiche maintenant correctement 100% à la fin.
- **Débogage API Amélioré** : Le "Mode de débogage d'erreur API" capture maintenant les corps de réponse complets des fournisseurs LLM et des services de recherche (Tavily/DuckDuckGo), et enregistre également une chronologie de transport par tentative avec les URL de requête nettoyées, la durée écoulée, les en-têtes de réponse, les corps de réponse partiels, le contenu de flux partiel analysé et les traces de pile pour un meilleur dépannage sur les replis OpenAI, Anthropic, Google, Azure OpenAI et Ollama.
- **Panneau du Mode Développeur** : Les réglages incluent maintenant un panneau de diagnostic dédié aux développeurs qui reste caché à moins que le "Mode développeur" ne soit activé. Il prend en charge la sélection de chemins d'appel de diagnostic et l'exécution de sondes de stabilité répétées pour le mode sélectionné.
- **Barre Latérale Redessinée** : Les actions intégrées sont groupées dans des sections ciblées avec des étiquettes plus claires, un statut en direct, une progression annulable et des journaux copiables pour réduire l'encombrement de la barre latérale. Le pied de page de progression/journal reste maintenant visible même lorsque chaque section est déployée, et l'état prêt utilise une piste de progression d'attente plus claire.
- **Polissage de l'Interaction et de la Lisibilité de la Barre Latérale** : Les boutons de la barre latérale offrent maintenant un retour de survol/pression/focus plus clair, et les boutons CTA colorés (y compris `One-Click Extract` et `Batch generate from titles`) utilisent un contraste de texte plus fort pour une meilleure lisibilité selon les thèmes.
- **Mappage CTA pour Fichier Unique** : Le style CTA coloré est maintenant réservé aux actions sur fichier unique. Les actions au niveau du lot/dossier et les workflows mixtes utilisent un style non-CTA pour réduire les erreurs de clic sur la portée de l'action.
- **Workflows Personnalisés en Un Clic** : Transformez les utilitaires intégrés de la barre latérale en boutons personnalisés réutilisables avec des noms définis par l'utilisateur et des chaînes d'actions assemblées. Un workflow par défaut `One-Click Extract` est inclus par défaut.


### Amélioration du Graphe de Connaissances
- **Wiki-Linking Automatique** : Identifie et ajoute des `[[wiki-links]]` aux concepts clés au sein de vos notes traitées en fonction de la sortie du LLM.
- **Création de Notes de Concept (Optionnel & Personnalisable)** : Crée automatiquement de nouvelles notes pour les concepts découverts dans un dossier de coffre spécifié.
- **Chemins de Sortie Personnalisables** : Configurez des chemins relatifs séparés dans votre coffre pour enregistrer les fichiers traités et les notes de concept nouvellement créées.
- **Noms de Fichier de Sortie Personnalisables (Ajout de Liens)** : Écrasez éventuellement le **fichier d'origine** ou utilisez un suffixe/chaîne de remplacement personnalisé au lieu du `_processed.md` par défaut lors du traitement des fichiers pour les liens.
- **Maintenance de l'Intégrité des Liens** : Gestion de base pour la mise à jour des liens lorsque les notes sont renommées ou supprimées dans le coffre.
- **Extraction de Concept Pure** : Extrayez des concepts et créez les notes de concept correspondantes sans modifier le document original. C'est idéal pour remplir une base de connaissances à partir de documents existants sans les altérer. Cette fonctionnalité a des options configurables pour créer des notes de concept minimales et ajouter des backlinks.


### Traduction

- **Traduction par IA** :
    - Traduisez le contenu des notes via le LLM configuré.
    - **Support des Fichiers Volumineux** : Divise automatiquement les gros fichiers en plus petits morceaux en fonction du réglage `Nombre de mots par morceau` avant de les envoyer au LLM. Les morceaux traduits sont ensuite combinés de manière transparente en un seul document.
    - Supporte la traduction entre plusieurs langues.
    - Langue cible personnalisable dans les réglages ou l'interface utilisateur.
    - Ouvre automatiquement le texte traduit sur le côté droit du texte original pour une lecture facile.
- **Traduction en Masse** :
    - Traduisez tous les fichiers d'un dossier sélectionné.
    - Supporte le traitement parallèle quand "Activer le parallélisme par lot" est activé.
    - Utilise des prompts personnalisés pour la traduction si configuré.
	- Ajoute une option "Traduire ce dossier en masse" au menu contextuel de l'explorateur de fichiers.
- **Désactiver la traduction automatique** : Lorsque cette option est activée, les tâches non-traduction ne forceront plus les sorties dans une langue spécifique, préservant le contexte linguistique original. La tâche explicite "Traduire" effectuera toujours la traduction comme configuré.


### Recherche Web et Génération de Contenu
- **Recherche Web et Résumé** :
    - Effectue des recherches web via Tavily (nécessite une clé API) ou DuckDuckGo (expérimental).
    - **Robustesse de Recherche Améliorée** : La recherche DuckDuckGo dispose maintenant d'une logique d'analyse améliorée (DOMParser avec repli Regex) pour gérer les changements de mise en page et assurer des résultats fiables.
    - Résume les résultats de recherche via le LLM configuré.
    - La langue de sortie du résumé peut être personnalisée dans les réglages.
    - Ajoute les résumés à la note actuelle.
    - Limite de jetons (tokens) configurable pour le contenu de recherche envoyé au LLM.
- **Génération de Contenu depuis Titre** :
    - Utilisez le titre de la note pour générer un contenu initial via LLM, en remplaçant le contenu existant.
    - **Recherche Optionnelle** : Configurez si vous souhaitez effectuer une recherche web (en utilisant le fournisseur sélectionné) pour fournir du contexte à la génération.
- **Génération de Contenu en Masse depuis Titres** : Génère du contenu pour toutes les notes d'un dossier sélectionné en fonction de leurs titres (respecte le réglage de recherche optionnel). Les fichiers traités avec succès sont déplacés vers un **sous-dossier "terminé" configurable** (ex: `[nomdudossier]_complete` ou un nom personnalisé) pour éviter de les retraiter.
- **Couplage d'Auto-Correction Mermaid** : Lorsque l'auto-correction Mermaid est activée, les workflows liés à Mermaid réparent maintenant automatiquement les fichiers générés ou les dossiers de sortie après le traitement. Cela couvre les flux de Traitement, Génération depuis titre, Génération en masse depuis titres, Recherche & Résumé, Résumer comme Mermaid et Traduction.


### Fonctionnalités Utilitaires
- **Résumer comme diagramme Mermaid** :
    - Cette fonctionnalité vous permet de résumer le contenu d'une note dans un diagramme Mermaid.
    - La langue de sortie du diagramme Mermaid peut être personnalisée dans les réglages.
    - **Dossier de Sortie Mermaid** : Configurez le dossier où les fichiers de diagramme Mermaid générés seront enregistrés.
    - **Traduire le Résumé en Sortie Mermaid** : Traduisez éventuellement le contenu du diagramme Mermaid généré dans la langue cible configurée.
    
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Correction de Format de Formule Simple** :
    - Corrige rapidement les formules mathématiques sur une seule ligne délimitées par un seul `$` en blocs standard à double `$$`.
    - **Fichier Unique** : Traite le fichier actuel via le bouton de la barre latérale ou la palette de commandes.
    - **Correction en Masse** : Traite tous les fichiers d'un dossier sélectionné via le bouton de la barre latérale ou la palette de commandes.

- **Vérifier les Doublons dans le Fichier Actuel** : Cette commande aide à identifier les termes potentiellement en double dans le fichier actif.
- **Détection de Doublons** : Vérification de base des mots en double dans le contenu du fichier en cours de traitement (résultats enregistrés dans la console).
- **Vérifier et Supprimer les Notes de Concept en Double** : Identifie les notes potentiellement en double dans le **Dossier de Notes de Concept** configuré en fonction des correspondances exactes de noms, pluriels, normalisation et inclusion de mots uniques par rapport aux notes en dehors du dossier. La portée de la comparaison (quelles notes en dehors du dossier de concept sont vérifiées) peut être configurée pour **tout le coffre**, **des dossiers inclus spécifiques**, ou **tous les dossiers sauf certains spécifiques**. Présente une liste détaillée avec les raisons et les fichiers en conflit, puis demande confirmation avant de déplacer les doublons identifiés vers la corbeille système. Affiche la progression pendant la suppression.
- **Correction Mermaid en Masse** : Applique les corrections de syntaxe Mermaid et LaTeX à tous les fichiers Markdown d'un dossier sélectionné par l'utilisateur.
    - **Prêt pour le Workflow** : Peut être utilisé comme utilitaire autonome ou comme étape dans un bouton de workflow personnalisé en un clic.
    - **Rapport d'Erreurs** : Génère un rapport `mermaid_error_{foldername}.md` listant les fichiers qui contiennent encore des erreurs Mermaid potentielles après le traitement.
    - **Déplacer les Fichiers en Erreur** : Déplace éventuellement les fichiers avec des erreurs détectées vers un dossier spécifié pour une revue manuelle.
    - **Détection Intelligente** : Vérifie maintenant intelligemment les fichiers pour les erreurs de syntaxe à l'aide de `mermaid.parse` avant de tenter des corrections, économisant du temps de traitement et évitant des modifications inutiles.
    - **Traitement Sécurisé** : Assure que les corrections de syntaxe sont appliquées exclusivement aux blocs de code Mermaid, empêchant la modification accidentelle de tableaux Markdown ou d'autres contenus. Inclut des protections robustes pour protéger la syntaxe des tableaux (ex: `| :--- |`) contre les corrections de débogage agressives.
    - **Mode de Débogage Profond** : Si les erreurs persistent après la correction initiale, un mode de débogage profond avancé est déclenché. Ce mode gère les cas limites complexes, notamment :
        - **Intégration des Commentaires** : Fusionne automatiquement les commentaires de fin (commençant par `%`) dans l'étiquette de l'arête (ex: `A -- Label --> B; % Commentaire` devient `A -- "Label(Commentaire)" --> B;`).
        - **Flèches Malformées** : Corrige les flèches absorbées par des guillemets (ex: `A -- "Label -->" B` devient `A -- "Label" --> B`).
        - **Sous-graphes en Ligne** : Convertit les étiquettes de sous-graphes en ligne en étiquettes d'arêtes.
        - **Correction de Flèche Inversée** : Corrige les flèches `X <-- Y` non standard en `Y --> X`.
        - **Correction du Mot-clé de Direction** : Assure que le mot-clé `direction` est en minuscules à l'intérieur des sous-graphes (ex: `Direction TB` -> `direction TB`).
        - **Conversion de Commentaires** : Convertit les commentaires `//` en étiquettes d'arêtes (ex: `A --> B; // Commentaire` -> `A -- "Commentaire" --> B;`).
        - **Correction d'Étiquettes en Double** : Simplifie les étiquettes entre crochets répétées (ex: `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Correction de Flèche Invalide** : Convertit la syntaxe de flèche invalide `--|>` en la syntaxe standard `-->`.
        - **Gestion Robuste des Étiquettes & Notes** : Amélioration de la gestion des étiquettes contenant des caractères spéciaux (comme `/`) et meilleur support pour la syntaxe de notes personnalisées (`note for ...`), assurant que les artefacts tels que les crochets de fin sont proprement supprimés.
        - **Mode de Correction Avancé** : Inclut des corrections robustes pour les étiquettes de nœuds sans guillemets contenant des espaces, des caractères spéciaux ou des crochets imbriqués (ex: `Node[Label [Texte]]` -> `Node["Label [Texte]"]`), assurant la compatibilité avec des diagrammes complexes comme les chemins d'évolution stellaire. Corrige également les étiquettes d'arêtes malformées (ex: `--["Label["-->` en `-- "Label" -->`). Convertit en outre les commentaires en ligne (`Consensus --> Adaptive; # Un consensus avancé` en `Consensus -- "Un consensus avancé" --> Adaptive`) et corrige les guillemets incomplets en fin de ligne (`;"` à la fin remplacé par `"]`).
                        - **Conversion de Notes** : Convertit automatiquement les commentaires `note right/left of` et les commentaires `note :` autonomes en définitions et connexions de nœuds Mermaid standard (ex: `note right of A: texte` devient `NoteA["Note: texte"]` lié à `A`), prévenant les erreurs de syntaxe et améliorant la mise en page. Supporte maintenant les liens fléchés (`-->`) et les liens pleins (`---`).
                        - **Support de Notes Étendu** : Convertit automatiquement `note for Node "Contenu"` et `note of Node "Contenu"` en nœuds de notes liés standard (ex: `NoteNode[" Contenu"]` lié à `Node`), assurant la compatibilité avec la syntaxe étendue par l'utilisateur.
                        - **Correction de Notes Améliorée** : Renomme automatiquement les notes avec une numérotation séquentielle (ex: `Note1`, `Note2`) pour éviter les problèmes d'alias lorsque plusieurs notes sont présentes.
                        - **Correction de Parallélogramme/Forme** : Corrige les formes de nœuds malformées comme `[/["Label["/]` en formes standard `["Label"]`, assurant la compatibilité avec le contenu généré.
                        - **Standardiser les Étiquettes avec Pipes** : Corrige et standardise automatiquement les étiquettes d'arêtes contenant des barres verticales (pipes), assurant qu'elles sont correctement entourées de guillemets (ex: `-->|Texte|` devient `-->|"Texte"|` et `-->|Math|^2|` devient `-->|"Math|^2"|`).
        - **Correction de Pipe Mal Placé** : Corrige les étiquettes d'arêtes mal placées apparaissant avant la flèche (ex: `>|"Label"| A --> B` devient `A -->|"Label"| B`).
                - **Fusionner les Doubles Étiquettes** : Détecte et fusionne les doubles étiquettes complexes sur une seule arête (ex: `A -- Label1 -- Label2 --> B` ou `A -- Label1 -- Label2 --- B`) en une seule étiquette propre avec des sauts de ligne (`A -- "Label1<br>Label2" --> B`).
                        - **Correction d'Étiquette sans Guillemets** : Met automatiquement des guillemets autour des étiquettes de nœuds contenant des caractères potentiellement problématiques (ex: guillemets, signes égal, opérateurs mathématiques) mais dépourvues de guillemets extérieurs (ex: `Plot[Plot "A"]` devient `Plot["Plot "A""]`), prévenant les erreurs de rendu.
                        - **Correction de Nœud Intermédiaire** : Divise les arêtes contenant une définition de nœud intermédiaire en deux arêtes séparées (ex: `A -- B[...] --> C` devient `A --> B[...]` et `B[...] --> C`), assurant une syntaxe Mermaid valide.
                        - **Correction d'Étiquette Concaténée** : Corrige de manière robuste les définitions de nœuds où l'ID est concaténé avec l'étiquette (ex: `SubdivideSubdivide...` devient `Subdivide["Subdivide..."]`), même lorsqu'il est précédé d'étiquettes avec pipes ou lorsque la duplication n'est pas exacte, en validant par rapport aux IDs de nœuds connus.
                        - **Extraire du Texte Original Spécifique** :
                            - Définissez une liste de questions dans les réglages.
                            - Extrait les segments de texte textuels de la note active qui répondent à ces questions.
                            - **Mode Requête Fusionnée** : Option pour traiter toutes les questions en un seul appel API pour plus d'efficacité.
                            - **Traduction** : Option pour inclure des traductions du texte extrait dans la sortie.
                            - **Sortie Personnalisée** : Chemin d'enregistrement et suffixe de nom de fichier configurables pour le fichier de texte extrait.
- **Test de Connexion LLM** : Vérifiez les réglages API pour le fournisseur actif.


## Installation

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Depuis le Marketplace d'Obsidian (Recommandé)
1. Ouvrez les **Réglages** d'Obsidian → **Plugins communautaires**.
2. Assurez-vous que le "Mode restreint" est **désactivé**.
3. Cliquez sur **Parcourir** les plugins communautaires et recherchez "Notemd".
4. Cliquez sur **Installer**.
5. Une fois installé, cliquez sur **Activer**.

### Installation Manuelle
1. Téléchargez les derniers fichiers de la version depuis la [page GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Chaque version inclut également `README.md` pour référence, mais l'installation manuelle ne nécessite que `main.js`, `styles.css` et `manifest.json`.
2. Accédez au dossier de configuration de votre coffre Obsidian : `<VotreCoffre>/.obsidian/plugins/`.
3. Créez un nouveau dossier nommé `notemd`.
4. Copiez `main.js`, `styles.css` et `manifest.json` dans le dossier `notemd`.
5. Redémarrez Obsidian.
6. Allez dans **Réglages** → **Plugins communautaires** et activez "Notemd".

## Configuration

Accédez aux réglages du plugin via :
**Réglages** → **Plugins communautaires** → **Notemd** (Cliquez sur l'icône d'engrenage).

### Configuration du Fournisseur LLM
1.  **Fournisseur Actif** : Sélectionnez le fournisseur LLM que vous souhaitez utiliser dans le menu déroulant.
2.  **Réglages du Fournisseur** : Configurez les réglages spécifiques au fournisseur sélectionné :
    *   **Clé API** : Requise pour la plupart des fournisseurs cloud (ex: OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Non nécessaire pour Ollama. Optionnelle pour LM Studio et le préréglage générique `OpenAI Compatible` lorsque votre point de terminaison accepte les accès anonymes ou avec des espaces réservés.
    *   **URL de Base / Point de Terminaison** : Le point de terminaison API pour le service. Des valeurs par défaut sont fournies, mais vous pourriez avoir besoin de les changer pour des modèles locaux (LMStudio, Ollama), des passerelles (OpenRouter, Requesty, OpenAI Compatible), ou des déploiements Azure spécifiques. **Requis pour Azure OpenAI.**
    *   **Modèle** : Le nom/ID spécifique du modèle à utiliser (ex: `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Assurez-vous que le modèle est disponible sur votre point de terminaison/fournisseur.
    *   **Température** : Contrôle l'aléa de la sortie du LLM (0=déterministe, 1=créativité max). Des valeurs plus basses (ex: 0.2-0.5) sont généralement préférables pour les tâches structurées.
    *   **Version de l'API (Azure uniquement)** : Requise pour les déploiements Azure OpenAI (ex: `2024-02-15-preview`).
3.  **Tester la Connexion** : Utilisez le bouton "Tester la connexion" pour le fournisseur actif pour vérifier vos réglages. Les fournisseurs compatibles OpenAI utilisent maintenant des vérifications spécifiques : des points de terminaison tels que `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` et `OpenAI Compatible` sondent directement `chat/completions`, tandis que les fournisseurs avec un point de terminaison `/models` fiable peuvent toujours utiliser le listage des modèles en premier. Si la première sonde échoue avec une déconnexion réseau transitoire telle que `ERR_CONNECTION_CLOSED`, Notemd bascule automatiquement sur la séquence de réessai stable au lieu d'échouer immédiatement.
4.  **Gérer les Configurations des Fournisseurs** : Utilisez les boutons "Exporter les fournisseurs" et "Importer les fournisseurs" pour sauvegarder/charger vos réglages de fournisseurs LLM vers/depuis un fichier `notemd-providers.json` dans le dossier de configuration du plugin. Cela facilite la sauvegarde et le partage.
5.  **Couverture des Préréglages** : En plus des fournisseurs d'origine, Notemd inclut maintenant des entrées de préréglage pour `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty`, et une cible générique `OpenAI Compatible` pour LiteLLM, vLLM, Perplexity, Vercel AI Gateway ou des proxies personnalisés.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Configuration Multi-Modèle
-   **Utiliser Différents Fournisseurs pour les Tâches** :
    *   **Désactivé (Par défaut)** : Utilise l'unique "Fournisseur Actif" (sélectionné plus haut) pour toutes les tâches.
    *   **Activé** : Vous permet de sélectionner un fournisseur spécifique *et* éventuellement de remplacer le nom du modèle pour chaque tâche ("Ajouter des liens", "Recherche & Résumé", "Générer depuis titre", "Traduire", "Extraire des concepts"). Si le champ de remplacement du modèle pour une tâche est laissé vide, il utilisera le modèle par défaut configuré pour le fournisseur sélectionné de cette tâche.
-   **Sélectionner différentes langues pour différentes tâches** :
    *   **Désactivé (Par défaut)** : Utilise l'unique "Langue de sortie" pour toutes les tâches.
    *   **Activé** : Vous permet de sélectionner une langue spécifique pour chaque tâche ("Ajouter des liens", "Recherche & Résumé", "Générer depuis titre", "Résumer comme diagramme Mermaid", "Extraire des concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Architecture des Langues (Langue de l'interface vs langue de sortie des tâches)

-   **Langue de l'interface** contrôle uniquement le texte de l'interface du plugin (étiquettes des réglages, boutons de la barre latérale, avis et fenêtres). Le mode `auto` par défaut suit la langue actuelle de l'interface d'Obsidian.
-   Les variantes régionales ou d’écriture sont désormais résolues vers le catalogue publié le plus proche au lieu de retomber directement sur l’anglais. Par exemple, `fr-CA` utilise le français, `es-419` l’espagnol, `pt-PT` le portugais, `zh-Hans` le chinois simplifié et `zh-Hant-HK` le chinois traditionnel.
-   **Langue de sortie des tâches** contrôle la sortie des tâches générée par le modèle (liens, résumés, génération de titres, résumé Mermaid, extraction de concepts, cible de traduction).
-   **Le mode de langue par tâche** permet à chaque tâche de résoudre sa propre langue de sortie à partir d'une couche de politique unifiée au lieu de remplacements dispersés par module.
-   **Désactiver la traduction automatique** garde les tâches non-traduction dans le contexte de la langue source, tandis que les tâches de traduction explicites appliquent toujours la langue cible configurée.
-   Les chemins de génération liés à Mermaid suivent la même politique de langue et peuvent toujours déclencher l'auto-correction Mermaid lorsqu'elle est activée.

### Réglages des Appels API Stables
-   **Activer les Appels API Stables (Logique de Réessai)** :
    *   **Désactivé (Par défaut)** : Un seul échec d'appel API arrêtera la tâche actuelle.
    *   **Activé** : Réessaie automatiquement les appels API LLM échoués (utile pour les problèmes de réseau intermittents ou les limites de débit).
    *   **Repli de Test de Connexion** : Même lorsque les appels normaux ne sont pas déjà en cours en mode stable, les tests de connexion fournisseur passent maintenant sur la même séquence de réessai après le premier échec réseau transitoire.
    *   **Repli de Transport au Temps d'Exécution (Sensible à l'Environnement)** : Les requêtes de tâches de longue durée qui sont interrompues transitoirement par `requestUrl` réessaient maintenant la même tentative via un repli sensible à l'environnement d'abord. Les builds de bureau utilisent Node `http/https` ; les environnements non-bureau utilisent `fetch` du navigateur. Ces tentatives de repli utilisent maintenant une analyse en streaming sensible au protocole sur les chemins LLM intégrés, couvrant SSE compatible OpenAI, SSE Azure OpenAI, SSE Anthropic Messages, SSE Google Gemini et la sortie NDJSON Ollama, de sorte que les passerelles lentes puissent renvoyer des morceaux de corps plus tôt. Les points d'entrée directs restants de style OpenAI réutilisent ce même chemin de repli partagé.
    *   **Ordre Stable compatible OpenAI** : En mode stable, chaque tentative compatible OpenAI suit maintenant : `streaming direct -> non-streaming direct -> requestUrl (avec repli en streaming si nécessaire)` avant de compter comme une tentative échouée. Cela empêche les échecs trop agressifs lorsqu'un seul mode de transport est instable.
-   **Intervalle de Réessai (secondes)** : (Visible uniquement si activé) Temps d'attente entre les tentatives de réessai (1-300 secondes). Par défaut : 5.
-   **Maximum de Réessais** : (Visible uniquement si activé) Nombre maximum de tentatives de réessai (0-10). Par défaut : 3.
-   **Mode de Débogage d'Erreur API** :
    *   **Désactivé (Par défaut)** : Utilise des rapports d'erreur standard et concis.
    *   **Activé** : Active une journalisation détaillée des erreurs (similaire à la sortie verbeuse de DeepSeek) pour tous les fournisseurs et tâches (y compris la traduction, la recherche et les tests de connexion). Cela inclut les codes de statut HTTP, le texte de réponse brut, les chronologies de transport des requêtes, les URL et en-têtes de requêtes nettoyés, les durées des tentatives écoulées, les en-têtes de réponse, les corps de réponse partiels, la sortie du flux partiel analysée et les traces de pile, ce qui est crucial pour diagnostiquer les problèmes de connexion API et les réinitialisations de passerelles en amont.
-   **Mode Développeur** :
    *   **Désactivé (Par défaut)** : Cache toutes les commandes de diagnostic réservées aux développeurs pour les utilisateurs normaux.
    *   **Activé** : Affiche un panneau de diagnostic dédié aux développeurs dans les réglages.
-   **Diagnostic Fournisseur pour Développeurs (Requête Longue)** :
    *   **Mode d'Appel de Diagnostic** : Choisissez le chemin d'exécution par sonde. Les fournisseurs compatibles OpenAI prennent en charge des modes forcés supplémentaires (`streaming direct`, `mise en mémoire tampon directe`, `requestUrl-uniquement`) en plus des modes d'exécution.
    *   **Lancer le Diagnostic** : Lance une sonde de requête longue avec le mode d'appel sélectionné et écrit `Notemd_Provider_Diagnostic_*.txt` à la racine du coffre.
    *   **Lancer le Test de Stabilité** : Répète la sonde pour un nombre de passages configurable (1-10) en utilisant le mode d'appel sélectionné et enregistre un rapport de stabilité agrégé.
    *   **Délai de Diagnostic** : Délai d'expiration (timeout) configurable par passage (15-3600 secondes).
    *   **Pourquoi l'utiliser** : Plus rapide qu'une reproduction manuelle lorsqu'un fournisseur réussit le "Test de connexion" mais échoue sur de vraies tâches de longue durée (par exemple, la traduction sur des passerelles lentes).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Réglages Généraux

#### Sortie des Fichiers Traités
-   **Personnaliser le Chemin d'Enregistrement des Fichiers Traités** :
    *   **Désactivé (Par défaut)** : Les fichiers traités (ex : `VotreNote_processed.md`) sont enregistrés dans le *même dossier* que la note originale.
    *   **Activé** : Vous permet de spécifier un emplacement d'enregistrement personnalisé.
-   **Chemin du Dossier des Fichiers Traités** : (Visible uniquement si activé ci-dessus) Entrez un *chemin relatif* dans votre coffre (ex : `Notes Traitées` ou `Sortie/LLM`) où les fichiers traités doivent être enregistrés. Les dossiers seront créés s'ils n'existent pas. **N'utilisez pas de chemins absolus (comme C:\...) ou de caractères invalides.**
-   **Utiliser un Nom de Fichier de Sortie Personnalisé pour 'Ajouter des Liens'** :
    *   **Désactivé (Par défaut)** : Les fichiers traités créés par la commande 'Ajouter des liens' utilisent le suffixe par défaut `_processed.md` (ex : `VotreNote_processed.md`).
    *   **Activé** : Vous permet de personnaliser le nom du fichier de sortie en utilisant le réglage ci-dessous.
-   **Suffixe / Chaîne de Remplacement Personnalisé** : (Visible uniquement si activé ci-dessus) Entrez la chaîne à utiliser pour le nom du fichier de sortie.
    *   S'il est laissé **vide**, le fichier d'origine sera **écrasé** par le contenu traité.
    *   Si vous entrez une chaîne (ex : `_linked`), elle sera ajoutée au nom de base d'origine (ex : `VotreNote_linked.md`). Assurez-vous que le suffixe ne contient pas de caractères de nom de fichier invalides.

-   **Supprimer les Blocs de Code lors de l'Ajout de Liens** :
    *   **Désactivé (Par défaut)** : Les blocs de code **(\`\\\`\`)** sont conservés dans le contenu lors de l'ajout de liens, et les blocs **(\`\\\`markdown)** seront supprimés automatiquement.
    *   **Activé** : Supprime les blocs de code du contenu avant d'ajouter des liens.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Sortie des Notes de Concept
-   **Personnaliser le Chemin des Notes de Concept** :
    *   **Désactivé (Par défaut)** : La création automatique de notes pour les `[[concepts liés]]` est désactivée.
    *   **Activé** : Vous permet de spécifier un dossier où les nouvelles notes de concept seront créées.
-   **Chemin du Dossier des Notes de Concept** : (Visible uniquement si activé ci-dessus) Entrez un *chemin relatif* dans votre coffre (ex : `Concepts` ou `Generé/Sujets`) où les nouvelles notes de concept doivent être enregistrées. Les dossiers seront créés s'ils n'existent pas. **Doit être rempli si la personnalisation est activée.** **N'utilisez pas de chemins absolus ou de caractères invalides.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Sortie du Fichier de Journal de Concepts
-   **Générer un Fichier de Journal de Concepts** :
    *   **Désactivé (Par défaut)** : Aucun fichier de journal n'est généré.
    *   **Activé** : Crée un fichier journal listant les notes de concept nouvellement créées après le traitement. Le format est :
        ```
        générer xx fichiers md de concepts
        1. concept1
        2. concept2
        ...
        n. conceptn
        ```
-   **Personnaliser le Chemin d'Enregistrement du Fichier Journal** : (Visible uniquement si "Générer un fichier de journal de concepts" est activé)
    *   **Désactivé (Par défaut)** : Le fichier journal est enregistré dans le **Chemin du dossier des notes de concept** (si spécifié) ou à la racine du coffre sinon.
    *   **Activé** : Vous permet de spécifier un dossier personnalisé pour le fichier journal.
-   **Chemin du Dossier de Journal de Concepts** : (Visible uniquement si activé ci-dessus) Entrez un *chemin relatif* dans votre coffre (ex : `Logs/Notemd`) où le fichier journal doit être enregistré. **Doit être rempli si la personnalisation est activée.**
-   **Personnaliser le Nom du Fichier Journal** : (Visible uniquement si "Générer un fichier de journal de concepts" est activé)
    *   **Désactivé (Par défaut)** : Le fichier journal est nommé `Generate.log`.
    *   **Activé** : Vous permet de spécifier un nom personnalisé pour le fichier journal.
-   **Nom du Fichier de Journal de Concepts** : (Visible uniquement si activé ci-dessus) Entrez le nom de fichier souhaité (ex : `CreationDeConcepts.log`). **Doit être rempli si la personnalisation est activée.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Tâche d'Extraction de Concepts
-   **Créer des notes de concept minimales** :
    *   **Activé (Par défaut)** : Les notes de concept nouvellement créées ne contiendront que le titre (ex : `# Concept`).
    *   **Désactivé** : Les notes de concept peuvent inclure du contenu supplémentaire, comme un lien de retour "Lié depuis", si cela n'est pas désactivé par le réglage ci-dessous.
-   **Ajouter un lien de retour "Lié depuis"** :
    *   **Désactivé (Par défaut)** : N'ajoute pas de lien de retour vers le document source dans la note de concept lors de l'extraction.
    *   **Activé** : Ajoute une section "Lié depuis" avec un lien vers le fichier source.

#### Extraire du Texte Original Spécifique
-   **Questions pour l'extraction** : Entrez une liste de questions (une par ligne) pour lesquelles vous souhaitez que l'IA extraie des réponses textuelles de vos notes.
-   **Traduire la sortie dans la langue correspondante** :
    *   **Désactivé (Par défaut)** : Produit uniquement le texte extrait dans sa langue d'origine.
    *   **Activé** : Ajoute une traduction du texte extrait dans la langue sélectionnée pour cette tâche.
-   **Mode requête fusionnée** :
    *   **Désactivé** : Traite chaque question individuellement (plus grande précision mais plus d'appels API).
    *   **Activé** : Envoie toutes les questions dans un seul prompt (plus rapide et moins d'appels API).
-   **Personnaliser le chemin d'enregistrement et le nom du fichier du texte extrait** :
    *   **Désactivé** : Enregistre dans le même dossier que le fichier d'origine avec le suffixe `_Extracted`.
    *   **Activé** : Vous permet de spécifier un dossier de sortie et un suffixe de nom de fichier personnalisés.

#### Correction Mermaid en Masse
-   **Activer la Détection d'Erreurs Mermaid** :
    *   **Désactivé (Par défaut)** : La détection d'erreurs est ignorée après le traitement.
    *   **Activé** : Analyse les fichiers traités pour les erreurs de syntaxe Mermaid restantes et génère un rapport `mermaid_error_{foldername}.md`.
-   **Déplacer les fichiers avec erreurs Mermaid vers un dossier spécifié** :
    *   **Désactivé** : Les fichiers avec erreurs restent à leur place.
    *   **Activé** : Déplace tous les fichiers qui contiennent encore des erreurs de syntaxe Mermaid après la tentative de correction vers un dossier dédié pour une revue manuelle.
-   **Chemin du dossier d'erreurs Mermaid** : (Visible si activé ci-dessus) Le dossier où déplacer les fichiers en erreur.

#### Paramètres de Traitement
-   **Activer le Parallélisme par Lot** :
    *   **Désactivé (Par défaut)** : Les tâches de traitement par lot (comme "Traiter le dossier" ou "Génération en masse depuis les titres") traitent les fichiers un par un (en série).
    *   **Activé** : Permet au plugin de traiter plusieurs fichiers simultanément, ce qui peut accélérer considérablement les gros travaux par lot.
-   **Concurrence de Lot** : (Visible uniquement si le parallélisme est activé) Définit le nombre maximum de fichiers à traiter en parallèle. Un nombre plus élevé peut être plus rapide mais consomme plus de ressources et peut atteindre les limites de débit de l'API. (Par défaut : 1, Plage : 1-20)
-   **Taille du Lot** : (Visible uniquement si le parallélisme est activé) Le nombre de fichiers à grouper dans un seul lot. (Par défaut : 50, Plage : 10-200)
-   **Délai entre les Lots (ms)** : (Visible uniquement si le parallélisme est activé) Un délai optionnel en millisecondes entre le traitement de chaque lot, ce qui peut aider à gérer les limites de débit de l'API. (Par défaut : 1000ms)
-   **Intervalle d'Appel API (ms)** : Délai minimum en millisecondes *avant et après* chaque appel API LLM individuel. Crucial pour les API à faible débit ou pour prévenir les erreurs 429. Réglez sur 0 pour aucun délai artificiel. (Par défaut : 500ms)
-   **Nombre de Mots par Morceau** : Nombre maximum de mots par morceau envoyé au LLM. Affecte le nombre d'appels API pour les gros fichiers. (Par défaut : 3000)
-   **Activer la Détection de Doublons** : Active/désactive la vérification de base des mots en double dans le contenu traité (résultats dans la console). (Par défaut : Activé)
-   **Max Tokens** : Nombre maximum de jetons que le LLM doit générer par morceau de réponse. Affecte le coût et le niveau de détail. (Par défaut : 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Traduction
-   **Langue Cible par Défaut** : Sélectionnez la langue par défaut vers laquelle vous souhaitez traduire vos notes. Cela peut être remplacé dans l'interface lors de l'exécution de la commande de traduction. (Par défaut : English)
-   **Personnaliser le Chemin d'Enregistrement des Fichiers Traduits** :
    *   **Désactivé (Par défaut)** : Les fichiers traduits sont enregistrés dans le *même dossier* que la note originale.
    *   **Activé** : Vous permet de spécifier un *chemin relatif* dans votre coffre (ex : `Traductions`) où les fichiers traduits doivent être enregistrés. Les dossiers seront créés s'ils n'existent pas.
-   **Utiliser un suffixe personnalisé pour les fichiers traduits** :
    *   **Désactivé (Par défaut)** : Les fichiers traduits utilisent le suffixe par défaut `_translated.md` (ex : `VotreNote_translated.md`).
    *   **Activé** : Vous permet de spécifier un suffixe personnalisé.
-   **Suffixe Personnalisé** : (Visible uniquement si activé ci-dessus) Entrez le suffixe personnalisé à ajouter aux noms de fichiers traduits (ex : `_es` ou `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Génération de Contenu
-   **Activer la Recherche dans 'Générer depuis titre'** :
    *   **Désactivé (Par défaut)** : 'Générer depuis titre' utilise uniquement le titre comme entrée.
    *   **Activé** : Effectue une recherche web en utilisant le **Fournisseur de Recherche Web** configuré et inclut les résultats comme contexte pour le LLM lors de la génération basée sur le titre.
-   **Exécuter automatiquement la correction de syntaxe Mermaid après génération** :
    *   **Activé (Par défaut)** : Exécute automatiquement une passe de correction de syntaxe Mermaid après les workflows liés à Mermaid tels que Traitement, Génération depuis titre, Génération en masse depuis titres, Recherche & Résumé, Résumer comme Mermaid et Traduction.
    *   **Désactivé** : Laisse la sortie Mermaid générée intacte à moins que vous ne lanciez la `Correction Mermaid en Masse` manuellement ou que vous ne l'ajoutiez à un workflow personnalisé.
-   **Langue de Sortie** : (Nouveau) Sélectionnez la langue de sortie souhaitée pour les tâches "Générer depuis titre" et "Génération en masse depuis titres".
    *   **Anglais (Par défaut)** : Les prompts sont traités et produits en anglais.
    *   **Autres Langues** : Le LLM reçoit l'instruction d'effectuer son raisonnement en anglais mais de fournir la documentation finale dans la langue de votre choix (ex : Espagnol, Français, Chinois Simplifié, Chinois Traditionnel, Arabe, Hindi, etc.).
-   **Changer le mot de prompt** : (Nouveau)
    *   **Changer le mot de prompt** : Vous permet de changer le mot de prompt pour une tâche spécifique.
    *   **Mot de prompt personnalisé** : Entrez votre mot de prompt personnalisé pour la tâche.
-   **Utiliser un Dossier de Sortie Personnalisé pour 'Générer depuis Titre'** :
    *   **Désactivé (Par défaut)** : Les fichiers générés avec succès sont déplacés vers un sous-dossier nommé `[NomDossierOriginal]_complete` par rapport au parent du dossier d'origine (ou `Vault_complete` si le dossier d'origine était la racine).
    *   **Activé** : Vous permet de spécifier un nom personnalisé pour le sous-dossier où les fichiers terminés sont déplacés.
-   **Nom du Dossier de Sortie Personnalisé** : (Visible uniquement si activé ci-dessus) Entrez le nom souhaité pour le sous-dossier (ex : `Contenu Généré`, `_complete`). Les caractères invalides ne sont pas autorisés. Par défaut sur `_complete` s'il est laissé vide. Ce dossier est créé par rapport au répertoire parent du dossier d'origine.

#### Boutons de Workflow en Un Clic
-   **Constructeur Visuel de Workflow** : Créez des boutons de workflow personnalisés à partir d'actions intégrées sans écrire manuellement le DSL.
-   **DSL des Boutons de Workflow Personnalisés** : Les utilisateurs avancés peuvent toujours éditer directement le texte de définition du workflow. Un DSL invalide bascule en toute sécurité sur le workflow par défaut et affiche un avertissement dans la barre latérale ou les réglages.
-   **Stratégie d'Erreur de Workflow** :
    *   **Arrêter en cas d'erreur (Par défaut)** : Arrête immédiatement le workflow dès qu'une étape échoue.
    *   **Continuer en cas d'erreur** : Continue l'exécution des étapes suivantes et signale le nombre d'actions échouées à la fin.
-   **Workflow par Défaut Inclus** : `One-Click Extract` enchaîne `Traiter le fichier (Ajout de liens)`, `Génération en masse depuis titres`, et `Correction Mermaid en masse`.

#### Réglages de Prompt Personnalisé
Cette fonctionnalité vous permet de remplacer les instructions par défaut (prompts) envoyées au LLM pour des tâches spécifiques, vous donnant un contrôle précis sur la sortie.

-   **Activer les Prompts Personnalisés pour des Tâches Spécifiques** :
    *   **Désactivé (Par défaut)** : Le plugin utilise ses prompts par défaut intégrés pour toutes les opérations.
    *   **Activé** : Active la possibilité de définir des prompts personnalisés pour les tâches listées ci-dessous. C'est l'interrupteur principal de cette fonctionnalité.

-   **Utiliser un Prompt Personnalisé pour [Nom de la tâche]** : (Visible uniquement si activé ci-dessus)
    *   Pour chaque tâche supportée ("Ajouter des liens", "Générer depuis titre", "Recherche & Résumé", "Extraire des concepts"), vous pouvez activer ou désactiver individuellement votre prompt personnalisé.
    *   **Désactivé** : Cette tâche spécifique utilisera le prompt par défaut.
    *   **Activé** : Cette tâche utilisera le texte que vous fournissez dans la zone de texte "Prompt personnalisé" correspondante ci-dessous.

-   **Zone de texte de Prompt Personnalisé** : (Visible uniquement si le prompt personnalisé d'une tâche est activé)
    *   **Affichage du Prompt par Défaut** : Pour votre référence, le plugin affiche le prompt par défaut qu'il utiliserait normalement pour la tâche. Vous pouvez utiliser le bouton **"Copier le prompt par défaut"** pour copier ce texte comme point de départ de votre propre prompt personnalisé.
    *   **Saisie du Prompt Personnalisé** : C'est ici que vous écrivez vos propres instructions pour le LLM.
    *   **Espaces réservés (Placeholders)** : Vous pouvez (et devriez) utiliser des espaces réservés spéciaux dans votre prompt, que le plugin remplacera par le contenu réel avant d'envoyer la requête au LLM. Référez-vous au prompt par défaut pour voir quels espaces réservés sont disponibles pour chaque tâche. Les espaces réservés courants incluent :
        *   `{TITLE}` : Le titre de la note actuelle.
        *   `{RESEARCH_CONTEXT_SECTION}` : Le contenu recueilli lors de la recherche web.
        *   `{USER_PROMPT}` : Le contenu de la note en cours de traitement.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Portée de la Vérification des Doublons
-   **Mode de Portée de la Vérification des Doublons** : Contrôle quels fichiers sont vérifiés par rapport aux notes de votre Dossier de Notes de Concept pour les doublons potentiels.
    *   **Tout le coffre (Par défaut)** : Compare les notes de concept avec toutes les autres notes du coffre (en excluant le Dossier de Notes de Concept lui-même).
    *   **Inclure uniquement des dossiers spécifiques** : Compare les notes de concept uniquement avec les notes des dossiers listés ci-dessous.
    *   **Exclure des dossiers spécifiques** : Compare les notes de concept avec toutes les notes *sauf* celles des dossiers listés ci-dessous (et en excluant également le Dossier de Notes de Concept).
    *   **Dossier de Concept uniquement** : Compare les notes de concept uniquement avec les *autres notes du Dossier de Notes de Concept*. Cela aide à trouver des doublons uniquement parmi vos concepts générés.
-   **Inclure/Exclure des dossiers** : (Visible uniquement si le mode est 'Inclure' ou 'Exclure') Entrez les *chemins relatifs* des dossiers que vous souhaitez inclure ou exclure, **un chemin par ligne**. Les chemins sont sensibles à la casse et utilisent `/` comme séparateur (ex : `Materiel de Reference/Articles` ou `Notes Quotidiennes`). Ces dossiers ne peuvent pas être identiques au Dossier de Notes de Concept ou se trouver à l'intérieur de celui-ci.

#### Fournisseur de Recherche Web
-   **Fournisseur de Recherche** : Choisissez entre `Tavily` (nécessite une clé API, recommandé) et `DuckDuckGo` (expérimental, souvent bloqué par le moteur de recherche pour les requêtes automatisées). Utilisé pour "Rechercher & Résumer un sujet" et optionnellement pour "Générer depuis titre".
-   **Clé API Tavily** : (Visible uniquement si Tavily est sélectionné) Entrez votre clé API provenant de [tavily.com](https://tavily.com/).
-   **Résultats Max Tavily** : (Visible uniquement si Tavily est sélectionné) Nombre maximum de résultats de recherche que Tavily doit renvoyer (1-20). Par défaut : 5.
-   **Profondeur de Recherche Tavily** : (Visible uniquement si Tavily est sélectionné) Choisissez `basic` (par défaut) ou `advanced`. Note : `advanced` fournit de meilleurs résultats mais coûte 2 crédits API par recherche au lieu de 1.
-   **Résultats Max DuckDuckGo** : (Visible uniquement si DuckDuckGo est sélectionné) Nombre maximum de résultats de recherche à analyser (1-10). Par défaut : 5.
-   **Délai d'Obtention du Contenu DuckDuckGo** : (Visible uniquement si DuckDuckGo est sélectionné) Nombre maximum de secondes à attendre lors de la tentative de récupération du contenu de chaque URL de résultat DuckDuckGo. Par défaut : 15.
-   **Jetons Max de Contenu de Recherche** : Nombre approximatif maximum de jetons provenant des résultats de recherche web combinés (extraits/contenu récupéré) à inclure dans le prompt de résumé. Aide à gérer la taille de la fenêtre de contexte et le coût. (Par défaut : 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Domaine d'Apprentissage Ciblé
-   **Activer le Domaine d'Apprentissage Ciblé** :
    *   **Désactivé (Par défaut)** : Les prompts envoyés au LLM utilisent les instructions standard d'usage général.
    *   **Activé** : Vous permet de spécifier un ou plusieurs domaines d'étude pour améliorer la compréhension contextuelle du LLM.
-   **Domaine d'Apprentissage** : (Visible uniquement si activé ci-dessus) Entrez votre/vos domaine(s) spécifique(s), ex : 'Science des Matériaux', 'Physique des Polymères', 'Machine Learning'. Cela ajoutera une ligne "Domaines Pertinents : [...]" au début des prompts, aidant le LLM à générer des liens et du contenu plus précis et pertinents pour votre domaine d'étude spécifique.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Guide d'Utilisation

### Flux Rapides et Barre Latérale

-   Ouvrez la barre latérale Notemd pour accéder aux sections d'actions groupées pour le traitement de base, la génération, la traduction, la connaissance et les utilitaires.
-   Utilisez la zone **Flux rapides** en haut de la barre latérale pour lancer des boutons multi-étapes personnalisés.
-   Le workflow par défaut **One-Click Extract** lance `Traiter le fichier (Ajout de liens)` -> `Génération en masse depuis titres` -> `Correction Mermaid en masse`.
-   La progression du workflow, les journaux par étape et les échecs sont affichés dans la barre latérale, avec un pied de page épinglé qui protège la barre de progression et la zone de journal d'être masquées par les sections déployées.
-   La carte de progression permet de lire en un coup d'œil le texte de statut, une pilule de pourcentage dédiée et le temps restant, et les mêmes workflows personnalisés peuvent être reconfigurés depuis les réglages.

### Traitement d'Origine (Ajout de Wiki-Links)
C'est la fonctionnalité de base centrée sur l'identification des concepts et l'ajout de `[[wiki-links]]`.

**Important :** Ce processus ne fonctionne que sur les fichiers `.md` ou `.txt`. Vous pouvez convertir gratuitement des fichiers PDF en fichiers MD à l'aide de [Mineru](https://github.com/opendatalab/MinerU) avant tout traitement ultérieur.

1.  **Utilisation de la Barre Latérale** :
    *   Ouvrez la barre latérale Notemd (icône baguette ou palette de commandes).
    *   Ouvrez le fichier `.md` ou `.txt`.
    *   Cliquez sur **"Process File (Add Links)"**.
    *   Pour traiter un dossier : Cliquez sur **"Process Folder (Add Links)"**, sélectionnez le dossier, et cliquez sur "Process".
    *   La progression est affichée dans la barre latérale. Vous pouvez annuler la tâche en utilisant le bouton "Annuler le traitement" dans la barre latérale.
    *   *Note pour le traitement de dossiers :* Les fichiers sont traités en arrière-plan sans être ouverts dans l'éditeur.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Utilisation de la Palette de Commandes** (`Ctrl+P` ou `Cmd+P`) :
    *   **Fichier Unique** : Ouvrez le fichier et lancez `Notemd: Process Current File`.
    *   **Dossier** : Lancez `Notemd: Process Folder`, puis sélectionnez le dossier. Les fichiers sont traités en arrière-plan sans être ouverts dans l'éditeur.
    *   Une fenêtre de progression apparaît pour les actions de la palette de commandes, incluant un bouton d'annulation.
    *   *Note :* le plugin supprime automatiquement les lignes `\boxed{` au début et `}` à la fin si elles sont trouvées dans le contenu final traité avant l'enregistrement.

### Nouvelles Fonctionnalités

1.  **Résumer comme diagramme Mermaid** :
    *   Ouvrez la note que vous souhaitez résumer.
    *   Lancez la commande `Notemd: Summarise as Mermaid diagram` (via la palette de commandes ou le bouton de la barre latérale).
    *   Le plugin générera une nouvelle note avec le diagramme Mermaid.

2.  **Traduire Note/Sélection** :
    *   Sélectionnez du texte dans une note pour traduire uniquement cette sélection, ou invoquez la commande sans sélection pour traduire toute la note.
    *   Lancez la commande `Notemd: Translate Note/Selection` (via la palette de commandes ou le bouton de la barre latérale).
    *   Une fenêtre apparaîtra vous permettant de confirmer ou de changer la **Langue Cible** (par défaut selon le réglage spécifié en Configuration).
    *   Le plugin utilise le **Fournisseur LLM** configuré (basé sur les réglages Multi-Modèle) pour effectuer la traduction.
    *   Le contenu traduit est enregistré dans le **Chemin d'Enregistrement des Traductions** configuré avec le suffixe approprié, et ouvert dans un **nouveau volet à droite** du contenu original pour une comparaison facile.
    *   Vous pouvez annuler cette tâche via le bouton de la barre latérale ou le bouton d'annulation de la fenêtre.
3.  **Traduire en Masse** :
    *   Lancez la commande `Notemd: Batch Translate Folder` depuis la palette de commandes et sélectionnez un dossier, ou faites un clic droit sur un dossier dans l'explorateur de fichiers et choisissez "Traduire ce dossier en masse".
    *   Le plugin traduira tous les fichiers Markdown du dossier sélectionné.
    *   Les fichiers traduits sont enregistrés dans le chemin de traduction configuré mais ne sont pas ouverts automatiquement.
    *   Ce processus peut être annulé via la fenêtre de progression.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Rechercher & Résumer un Sujet** :
    *   Sélectionnez du texte dans une note OU assurez-vous que la note a un titre (ce sera le sujet de recherche).
    *   Lancez la commande `Notemd: Research and Summarize Topic` (via la palette de commandes ou le bouton de la barre latérale).
    *   Le plugin utilise le **Fournisseur de Recherche** configuré (Tavily/DuckDuckGo) et le **Fournisseur LLM** approprié (basé sur les réglages Multi-Modèle) pour trouver et résumer les informations.
    *   Le résumé est ajouté à la fin de la note actuelle.
    *   Vous pouvez annuler cette tâche via le bouton de la barre latérale ou le bouton d'annulation de la fenêtre.
    *   *Note :* Les recherches DuckDuckGo peuvent échouer en raison de la détection de robots. Tavily est recommandé.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Générer du Contenu depuis Titre** :
    *   Ouvrez une note (elle peut être vide).
    *   Lancez la commande `Notemd: Generate Content from Title` (via la palette de commandes ou le bouton de la barre latérale).
    *   Le plugin utilise le **Fournisseur LLM** approprié (basé sur les réglages Multi-Modèle) pour générer du contenu basé sur le titre de la note, remplaçant tout contenu existant.
    *   Si le réglage **"Activer la recherche dans 'Générer depuis titre'"** est activé, il effectuera d'abord une recherche web (en utilisant le **Fournisseur de Recherche Web** configuré) et inclura ce contexte dans le prompt envoyé au LLM.
    *   Vous pouvez annuler cette tâche via le bouton de la barre latérale ou le bouton d'annulation de la fenêtre.

5.  **Générer du Contenu en Masse depuis Titres** :
    *   Lancez la commande `Notemd: Batch Generate Content from Titles` (via la palette de commandes ou le bouton de la barre latérale).
    *   Sélectionnez le dossier contenant les notes que vous souhaitez traiter.
    *   Le plugin passera en revue chaque fichier `.md` du dossier (en excluant les fichiers `_processed.md` et les fichiers du dossier "terminé" désigné), générant du contenu basé sur le titre de la note et remplaçant le contenu existant. Les fichiers sont traités en arrière-plan sans être ouverts dans l'éditeur.
    *   Les fichiers traités avec succès sont déplacés vers le dossier "terminé" configuré.
    *   Cette commande respecte le réglage **"Activer la recherche dans 'Générer depuis titre'"** pour chaque note traitée.
    *   Vous pouvez annuler cette tâche via le bouton de la barre latérale ou le bouton d'annulation de la fenêtre.
    *   La progression et les résultats (nombre de fichiers modifiés, erreurs) sont affichés dans le journal de la barre latérale/fenêtre.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Vérifier et Supprimer les Notes de Concept en Double** :
    *   Assurez-vous que le **Chemin du Dossier des Notes de Concept** est correctement configuré dans les réglages.
    *   Lancez `Notemd: Check and Remove Duplicate Concept Notes` (via la palette de commandes ou le bouton de la barre latérale).
    *   Le plugin analyse le dossier des notes de concept et compare les noms de fichiers aux notes en dehors du dossier à l'aide de plusieurs règles (correspondance exacte, pluriels, normalisation, inclusion).
    *   Si des doublons potentiels sont trouvés, une fenêtre modale apparaît listant les fichiers, la raison pour laquelle ils ont été signalés et les fichiers en conflit.
    *   Examinez attentivement la liste. Cliquez sur **"Supprimer les fichiers"** pour déplacer les fichiers listés vers la corbeille système, ou sur **"Annuler"** pour ne rien faire.
    *   La progression et les résultats sont affichés dans le journal de la barre latérale/fenêtre.

7.  **Extraire des Concepts (Mode Pure)** :
    *   Cette fonctionnalité vous permet d'extraire des concepts d'un document et de créer les notes de concept correspondantes *sans* altérer le fichier d'origine. C'est parfait pour remplir rapidement votre base de connaissances à partir d'un ensemble de documents.
    *   **Fichier Unique** : Ouvrez un fichier et lancez la commande `Notemd: Extraire les concepts (créer uniquement les notes de concept)` depuis la palette de commandes ou cliquez sur le bouton **"Extraire les concepts (fichier actuel)"** dans la barre latérale.
    *   **Dossier** : Lancez la commande `Notemd: Extraction en masse des concepts depuis le dossier` depuis la palette de commandes ou cliquez sur le bouton **"Extraire les concepts (dossier)"** dans la barre latérale, puis sélectionnez un dossier pour traiter toutes ses notes.
    *   Le plugin lira les fichiers, identifiera les concepts et créera de nouvelles notes pour eux dans votre **Dossier de Notes de Concept** désigné, laissant vos fichiers d'origine intacts.

8.  **Créer un Wiki-Link & Générer une Note depuis la Sélection** :
    *   Cette commande puissante simplifie le processus de création et de remplissage de nouvelles notes de concept.
    *   Sélectionnez un mot ou une phrase dans votre éditeur.
    *   Lancez la commande `Notemd: Create Wiki-Link & Generate Note from Selection` (il est recommandé d'assigner un raccourci clavier à celle-ci, comme `Cmd+Shift+W`).
    *   Le plugin va :
        1.  Remplacer votre texte sélectionné par un `[[wiki-link]]`.
        2.  Vérifier si une note avec ce titre existe déjà dans votre **Dossier de Notes de Concept**.
        3.  Si elle existe, il ajoute un lien de retour vers la note actuelle.
        4.  Si elle n'existe pas, il crée une nouvelle note vide.
        5.  Il lance ensuite automatiquement la commande **"Generate Content from Title"** sur la nouvelle note ou la note existante, la remplissant de contenu généré par l'IA.

9.  **Extraire des Concepts et Générer des Titres** :
    *   Cette commande enchaîne deux fonctionnalités puissantes pour un workflow simplifié.
    *   Lancez la commande `Notemd: Extract Concepts and Generate Titles` depuis la palette de commandes (il est recommandé d'assigner un raccourci clavier à celle-ci).
    *   Le plugin va :
        1.  D'abord, lancer la tâche **"Extraire les concepts (fichier actuel)"** sur le fichier actuellement actif.
        2.  Ensuite, il lancera automatiquement la tâche **"Génération en masse depuis titres"** sur le dossier que vous avez configuré comme **Chemin du dossier des notes de concept** dans les réglages.
    *   Ceci vous permet de remplir d'abord votre base de connaissances avec de nouveaux concepts à partir d'un document source, puis d'étoffer immédiatement ces nouvelles notes de concept avec du contenu généré par l'IA en une seule étape.

10. **Extraire du Texte Original Spécifique** :
    *   Configurez vos questions dans les réglages sous "Extraire du texte original spécifique".
    *   Utilisez le bouton "Extraire du texte original spécifique" dans la barre latérale pour traiter le fichier actif.
    *   **Mode Fusionné** : Permet un traitement plus rapide en envoyant toutes les questions dans un seul prompt.
    *   **Traduction** : Traduit optionnellement le texte extrait dans votre langue configurée.
    *   **Sortie Personnalisée** : Configurez où et comment le fichier extrait est enregistré.

11. **Correction Mermaid en Masse** :
    *   Utilisez le bouton "Correction Mermaid en masse" dans la barre latérale pour scanner un dossier et corriger les erreurs de syntaxe Mermaid courantes.
    *   Le plugin signalera tout fichier contenant encore des erreurs dans un fichier `mermaid_error_{foldername}.md`.
    *   Configurez optionnellement le plugin pour déplacer ces fichiers problématiques vers un dossier séparé pour revue.

## Fournisseurs LLM Supportés

| Fournisseur        | Type    | Clé API Requise        | Notes                                                                 |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Oui                    | Point de terminaison DeepSeek natif avec gestion des modèles de raisonnement |
| Qwen               | Cloud   | Oui                    | Préréglage mode compatible DashScope pour les modèles Qwen / QwQ      |
| Qwen Code          | Cloud   | Oui                    | Préréglage focalisé sur le code DashScope pour les modèles Qwen coder |
| Doubao             | Cloud   | Oui                    | Préréglage Volcengine Ark ; réglez généralement le champ modèle sur votre ID de point de terminaison |
| Moonshot           | Cloud   | Oui                    | Point de terminaison officiel Kimi / Moonshot                         |
| GLM                | Cloud   | Oui                    | Point de terminaison BigModel Zhipu officiel compatible OpenAI        |
| Z AI               | Cloud   | Oui                    | Point de terminaison compatible OpenAI GLM/Zhipu international ; complète `GLM` |
| MiniMax            | Cloud   | Oui                    | Point de terminaison officiel MiniMax chat-completions                |
| Huawei Cloud MaaS  | Cloud   | Oui                    | Point de terminaison compatible OpenAI Huawei ModelArts MaaS pour modèles hébergés |
| Baidu Qianfan      | Cloud   | Oui                    | Point de terminaison officiel Qianfan compatible OpenAI pour modèles ERNIE |
| SiliconFlow        | Cloud   | Oui                    | Point de terminaison officiel SiliconFlow compatible OpenAI pour modèles OSS hébergés |
| OpenAI             | Cloud   | Oui                    | Supporte les modèles GPT et les séries o                              |
| Anthropic          | Cloud   | Oui                    | Supporte les modèles Claude                                           |
| Google             | Cloud   | Oui                    | Supporte les modèles Gemini                                           |
| Mistral            | Cloud   | Oui                    | Supporte les familles Mistral et Codestral                            |
| Azure OpenAI       | Cloud   | Oui                    | Nécessite Point de terminaison, Clé API, nom de déploiement et Version d'API |
| OpenRouter         | Passerelle| Oui                  | Accédez à de nombreux fournisseurs via les IDs de modèle OpenRouter   |
| xAI                | Cloud   | Oui                    | Point de terminaison Grok natif                                       |
| Groq               | Cloud   | Oui                    | Inférence rapide compatible OpenAI pour modèles OSS hébergés          |
| Together           | Cloud   | Oui                    | Point de terminaison compatible OpenAI pour modèles OSS hébergés      |
| Fireworks          | Cloud   | Oui                    | Point de terminaison d'inférence compatible OpenAI                    |
| Requesty           | Passerelle| Oui                  | Routeur multi-fournisseur derrière une seule clé API                  |
| OpenAI Compatible  | Passerelle| Optionnel            | Préréglage générique pour LiteLLM, vLLM, Perplexity, Vercel AI Gateway, etc. |
| LMStudio           | Local   | Optionnel (`EMPTY`)    | Lance des modèles localement via le serveur LM Studio                 |
| Ollama             | Local   | Non                    | Lance des modèles localement via le serveur Ollama                    |

*Note : Pour les fournisseurs locaux (LMStudio, Ollama), assurez-vous que l'application serveur respective est lancée et accessible à l'URL de base configurée.*
*Note : Pour OpenRouter et Requesty, utilisez l'identifiant de modèle complet/préfixé par le fournisseur affiché par la passerelle (par exemple `google/gemini-flash-1.5` ou `anthropic/claude-3-7-sonnet-latest`).*
*Note : `Doubao` attend généralement un ID de point de terminaison/déploiement Ark dans le champ modèle plutôt qu'un nom brut de famille de modèle. L'écran des réglages prévient maintenant quand la valeur d'espace réservé est encore présente et bloque les tests de connexion jusqu'à ce que vous la remplaciez par un vrai ID de point de terminaison.*
*Note : `Z AI` cible la ligne internationale `api.z.ai`, tandis que `GLM` conserve le point de terminaison BigModel en Chine continentale. Choisissez le préréglage qui correspond à la région de votre compte.*
*Note : Les préréglages focalisés sur la Chine utilisent des vérifications de connexion chat-first afin que le test valide le modèle/déploiement réellement configuré, et pas seulement l'accessibilité de la clé API.*
*Note : `OpenAI Compatible` est destiné aux passerelles et proxies personnalisés. Réglez l'URL de base, la politique de clé API et l'ID de modèle selon la documentation de votre fournisseur.*

## Utilisation du Réseau et Manipulation des Données

Notemd s'exécute localement à l'intérieur d'Obsidian, mais certaines fonctionnalités envoient des requêtes vers l'extérieur.

### Appels aux Fournisseurs LLM (Configurables)

- Déclencheur : traitement de fichiers, génération, traduction, résumé de recherche, résumé Mermaid, et actions de connexion/diagnostic.
- Point de terminaison : votre/vos URL(s) de base de fournisseur configurée(s) dans les réglages Notemd.
- Données envoyées : texte du prompt et contenu de la tâche requis pour le traitement.
- Note sur la manipulation des données : les clés API sont configurées localement dans les réglages du plugin et utilisées pour signer les requêtes depuis votre appareil.

### Appels de Recherche Web (Optionnels)

- Déclencheur : quand la recherche web est activée et qu'un fournisseur de recherche est sélectionné.
- Point de terminaison : API Tavily ou points de terminaison DuckDuckGo.
- Données envoyées : votre requête de recherche et les métadonnées de requête requises.

### Diagnostics Développeur et Journaux de Débogage (Optionnels)

- Déclencheur : mode de débogage API et actions de diagnostic développeur.
- Stockage : les journaux de diagnostic et d'erreurs sont écrits à la racine de votre coffre (par exemple `Notemd_Provider_Diagnostic_*.txt` et `Notemd_Error_Log_*.txt`).
- Note sur les risques : les journaux peuvent contenir des extraits de requêtes/réponses. Relisez les journaux avant de les partager publiquement.

### Stockage Local

- La configuration du plugin est stockée dans `.obsidian/plugins/notemd/data.json`.
- Les fichiers générés, rapports et journaux optionnels sont stockés dans votre coffre selon vos réglages.

## Dépannage

### Problèmes Courants
-   **Le plugin ne se charge pas** : Assurez-vous que `manifest.json`, `main.js`, `styles.css` sont dans le bon dossier (`<Coffre>/.obsidian/plugins/notemd/`) et redémarrez Obsidian. Vérifiez la Console Développeur (`Ctrl+Shift+I` ou `Cmd+Option+I`) pour les erreurs au démarrage.
-   **Échecs de traitement / Erreurs API** :
    1.  **Vérifier le format de fichier** : Assurez-vous que le fichier que vous tentez de traiter ou de vérifier a une extension `.md` ou `.txt`. Notemd ne supporte actuellement que ces formats textuels.
    2.  Utilisez la commande/bouton "Tester la connexion LLM" pour vérifier les réglages du fournisseur actif.
    3.  Vérifiez deux fois la clé API, l'URL de base, le nom du modèle et la version de l'API (pour Azure). Assurez-vous que la clé API est correcte et dispose de crédits/permissions suffisants.
    4.  Assurez-vous que votre serveur LLM local (LMStudio, Ollama) est lancé et que l'URL de base est correcte (ex : `http://localhost:1234/v1` pour LMStudio).
    5.  Vérifiez votre connexion internet pour les fournisseurs cloud.
    6.  **Pour les erreurs de traitement de fichier unique :** Consultez la Console Développeur pour les messages d'erreur détaillés. Copiez-les via le bouton dans la fenêtre d'erreur si nécessaire.
    7.  **Pour les erreurs de traitement en masse :** Vérifiez le fichier `error_processing_filename.log` à la racine de votre coffre pour les messages d'erreur détaillés pour chaque fichier échoué. La Console Développeur ou la fenêtre d'erreur pourrait afficher un résumé ou une erreur de lot générale.
    8.  **Journaux d'erreurs automatiques :** Si un processus échoue, le plugin enregistre automatiquement un fichier journal détaillé nommé `Notemd_Error_Log_[Timestamp].txt` dans le répertoire racine de votre coffre. Ce fichier contient le message d'erreur, la trace de la pile et les journaux de session. Si vous rencontrez des problèmes persistants, veuillez vérifier ce fichier. L'activation du "Mode de débogage d'erreur API" dans les réglages remplira ce journal avec des données de réponse API encore plus détaillées.
    9.  **Diagnostics de requêtes longues sur points de terminaison réels (Développeur)** :
        - Chemin intra-plugin (recommandé en premier) : utilisez **Réglages -> Notemd -> Diagnostic fournisseur pour développeurs (requête longue)** pour lancer une sonde en temps réel sur le fournisseur actif et générer `Notemd_Provider_Diagnostic_*.txt` à la racine du coffre.
        - Chemin CLI (hors exécution Obsidian) : pour une comparaison reproductible au niveau du point de terminaison entre comportement mis en mémoire tampon et streaming, utilisez :
        ```bash
        npm run diagnose:llm -- \
          --transport openai-compatible \
          --provider-name OpenRouter \
          --base-url https://openrouter.ai/api/v1 \
          --api-key "$OPENROUTER_API_KEY" \
          --model anthropic/claude-3.7-sonnet \
          --prompt-file ./tmp/prompt.txt \
          --content-file ./tmp/content.txt \
          --mode compare \
          --timeout-ms 360000 \
          --output ./tmp/openrouter-diagnostic.txt
        ```
        Le rapport généré contient le chronométrage par tentative (`First Byte`, `Duration`), les métadonnées de requête nettoyées, les en-têtes de réponse, les fragments de corps bruts/partiels, les fragments de flux analysés et les points d'échec de la couche transport.
-   **Problèmes de Connexion LM Studio/Ollama** :
    *   **Échec du test de connexion** : Assurez-vous que le serveur local (LM Studio ou Ollama) est lancé et que le bon modèle est chargé/disponible.
    *   **Erreurs CORS (Ollama sur Windows)** : Si vous rencontrez des erreurs CORS (Cross-Origin Resource Sharing) en utilisant Ollama sur Windows, vous pourriez avoir besoin de définir la variable d'environnement `OLLAMA_ORIGINS`. Vous pouvez le faire en lançant `set OLLAMA_ORIGINS=*` dans votre invite de commande avant de démarrer Ollama. Cela autorise les requêtes de n'importe quelle origine.
    *   **Activer CORS dans LM Studio** : Pour LM Studio, vous pouvez activer le CORS directement dans les réglages du serveur, ce qui peut être nécessaire si Obsidian s'exécute dans un navigateur ou a des politiques d'origine strictes.
-   **Erreurs de Création de Dossier ("Le nom du fichier ne peut pas contenir...")** :
    *   Cela signifie généralement que le chemin fourni dans les réglages (**Chemin du dossier des fichiers traités** ou **Chemin du dossier des notes de concept**) est invalide *pour Obsidian*.
    *   **Assurez-vous d'utiliser des chemins relatifs** (ex : `Traite`, `Notes/Concepts`) et **non des chemins absolus** (ex : `C:\Utilisateurs\...`, `/Users/...`).
    *   Vérifiez les caractères invalides : `* " \ / < > : | ? # ^ [ ]`. Notez que `\` est invalide même sur Windows pour les chemins Obsidian. Utilisez `/` comme séparateur de chemin.
-   **Problèmes de Performance** : Le traitement de gros fichiers ou de nombreux fichiers peut prendre du temps. Réduisez le réglage "Nombre de mots par morceau" pour des appels API potentiellement plus rapides (mais plus nombreux). Essayez un autre fournisseur LLM ou modèle.
-   **Liens Inattendus** : La qualité des liens dépend fortement du LLM et du prompt. Expérimentez avec différents modèles ou réglages de température.

## Contribution

Les contributions sont les bienvenues ! Veuillez vous référer au dépôt GitHub pour les directives : [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## Documentation du Mainteneur

- [Workflow de Release (Anglais)](./docs/maintainer/release-workflow.md)
- [Workflow de Release (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Licence

Licence MIT - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

*Notemd v1.8.1 - Améliorez votre graphe de connaissances Obsidian avec l'IA.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
