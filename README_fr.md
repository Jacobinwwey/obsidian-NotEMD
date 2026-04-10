
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

**Version :** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Table des Matières
- [Démarrage Rapide](#démarrage-rapide)
- [Support Linguistique](#support-linguistique)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Configuration](#configuration)
- [Guide d'Utilisation](#guide-dutilisation)
- [Fournisseurs LLM Supportés](#fournisseurs-llm-supportés)
- [Utilisation du Réseau et Manipulation des Données](#utilisation-du-réseau-et-manipulation-des-données)
- [Dépannage](#dépannage)
- [Contribution](#contribuer)
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
| `UI Locale` | Texte de l'interface uniquement (réglages, barre latérale) | `auto` | Suit la langue d'Obsidian ; catalogues actuels : `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Sortie des tâches générée par LLM (liens, résumés) | `en` | Peut être global ou par tâche. |
| `Disable auto translation` | Les tâches non-traduction gardent le contexte original | `false` | Les tâches de `Traduction` explicites appliquent toujours la langue cible. |

- La documentation officielle est maintenue en anglais et en chinois simplifié, avec un support complet pour plus de 30 langues.
- Toutes les langues supportées sont liées dans l'en-tête ci-dessus.

## Fonctionnalités Principales

### Traitement de Documents par l'IA
- **Support Multi-LLM** : Connectez-vous à divers fournisseurs LLM cloud et locaux.
- **Découpage Intelligent** : Divise automatiquement les grands documents en morceaux gérables.
- **Préservation du Contenu** : Maintient le formatage original tout en ajoutant structure et liens.
- **Logique de Réessai** : Tentative automatique facultative pour les appels API échoués.
- **Préréglages pour la Chine** : Inclut `Qwen`, `Doubao`, `Moonshot`, etc.

### Amélioration du Graphe de Connaissances
- **Wiki-Linking Automatique** : Identifie et ajoute des wiki-links aux concepts clés.
- **Création de Notes de Concept** : Crée automatiquement de nouvelles notes pour les concepts découverts.

### Traduction
- **Traduction par IA** : Traduit le contenu des notes via le LLM configuré.
- **Traduction en Masse** : Traduit tous les fichiers d'un dossier sélectionné.

### Recherche Web et Génération de Contenu
- **Recherche Web** : Effectue des recherches via Tavily ou DuckDuckGo et résume les résultats.
- **Génération depuis Titre** : Utilise le titre de la note pour générer du contenu initial.
- **Auto-Correction Mermaid** : Répare automatiquement la syntaxe des diagrammes Mermaid générés.

## Installation
1. Allez dans **Réglages** → **Plugins communautaires**.
2. Assurez-vous que le "Mode restreint" est **désactivé**.
3. Cliquez sur **Parcourir** et cherchez "Notemd".
4. Cliquez sur **Installer** puis sur **Activer**.

## Licence
Licence MIT - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---
*Notemd v1.8.0 - Améliorez votre graphe de connaissances Obsidian avec l'IA.*
