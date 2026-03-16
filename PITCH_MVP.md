# 🎤 Pitch MVP : EventBenin Location

## 1. Le Concept (La "Big Idea")
**EventBenin** est la première plateforme centralisée de location de matériel événementiel au Bénin. C'est le "Airbnb" de la chaise, de la sono et des chapiteaux.

**Le Problème :**
Aujourd'hui, organiser un événement à Cotonou est un parcours du combattant. Il faut appeler 10 prestataires différents, les prix sont "à la tête du client", et la disponibilité n'est jamais garantie sans se déplacer.

**La Solution :**
Une marketplace unique où les loueurs exposent leur stock et où les clients réservent en quelques clics, avec des prix transparents et une logistique simplifiée.

---

## 2. Comment ça marche ? (Le Flux Utilisateur)

Le MVP (Produit Minimum Viable) actuel couvre le parcours essentiel "De la recherche à la réservation".

### 👤 Côté Client (L'Organisateur)
L'expérience est conçue pour être aussi simple qu'un site e-commerce classique, mais adapté à la location.

1.  **Découverte & Recherche** :
    *   L'utilisateur arrive sur la **Home Page**. Il est accueilli par une promesse claire et une barre de recherche (Date / Type de matériel).
    *   Il peut naviguer via le **Catalogue** filtrable (Sonorisation, Mobilier, Tentes...).
    *   *Tech* : Le catalogue est dynamique, permettant de voir immédiatement les produits "Populaires".

2.  **Sélection & Transparence** :
    *   Sur la **Fiche Produit**, le client voit les photos réelles, le prix par jour (fixe et transparent) et les caractéristiques techniques.
    *   Il ajoute les articles à son **Panier**. Le système gère la quantité et la durée.

3.  **Le Panier Intelligent** :
    *   Le panier récapitule tous les besoins.
    *   Il calcule automatiquement le sous-total et affiche une estimation des frais.
    *   *MVP* : Le panier est persistant (sauvegardé dans le navigateur) pour ne pas perdre sa sélection si on change de page.

4.  **Validation (Simulation)** :
    *   Le client clique sur "Payer".
    *   Dans cette version MVP, nous simulons l'intégration **Mobile Money (MTN/Moov)**, le moyen de paiement n°1 au Bénin.

### 👤 Côté Client - Espace Personnel
Après validation du panier, le client accède à son tableau de bord.

1.  **Dashboard Client** :
    *   L'organisateur dispose d'un espace dédié (`dashboard-client.html`) où il peut :
        *   Voir ses **réservations actives** avec tous les détails (Date, lieu, articles loués, montant).
        *   Consulter l'**historique** de ses événements passés.
        *   **Télécharger les factures** et **contacter directement les loueurs**.
        *   Gérer son profil et ses favoris.

### 🏪 Côté Loueur (Le Partenaire)
Pour que la plateforme vive, il faut des loueurs.

1.  **Dashboard Loueur** :
    *   Le loueur dispose d'un espace dédié (`dashboard-loueur.html`).
    *   Il a une **Vue d'ensemble** de son activité : Revenus, Réservations en attente, Inventaire.
    *   Il peut voir les commandes récentes et leur statut (Confirmé, En attente).

---

## 3. La Stack Technique ("Comment c'est fait")

Ce projet est une démonstration de **développement rapide et efficace**.

*   **Architecture** : Site statique moderne (HTML5 / CSS3 / Vanilla JS).
    *   *Pourquoi ?* Rapidité de chargement maximale, hébergement gratuit/peu coûteux, robustesse.
*   **Design** : Interface "Mobile First", épurée et professionnelle, utilisant des variables CSS pour une maintenance facile du thème (Vert #008751 et Jaune #FCD116).

---

## 4. Prochaines Étapes (Roadmap)

Pour passer du MVP à la V1 commerciale :
1.  **Backend** : Connecter une base de données (Firebase ou Supabase) pour stocker les réservations réellement.
2.  **Paiement** : Intégrer l'API réelle de Fedapay ou Kkiapay.
3.  **Messagerie** : Ajouter un chat en direct entre Loueur et Client.
