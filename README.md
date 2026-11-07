# TP — Architecture orientée microservices : E-commerce

## 1. Objectif

Vous disposez d'une application e-commerce développée en React. Son interface est fonctionnelle et utilise initialement des services simulés (*mock*).

Votre mission consiste à développer des microservices REST indépendants, puis à connecter progressivement ces services à l'interface fournie.

**Règle fondamentale : vous ne devez pas modifier les pages ni les composants React.** L'intégration s'effectue uniquement à travers le fichier `src/config/backend.js`.

## 2. Installation

Prérequis : Node.js et npm.

```bash
git clone https://github.com/ZOUHEIRBN/MSOA-E-com-Demo.git
cd MSOA-E-com-Demo
npm install
npm run dev
```

Ouvrez l'adresse affichée par Vite (généralement `http://localhost:5173`).

Compte de démonstration en mode mock :

- Email : `demo@msoa.shop`
- Mot de passe : `demo123`

## 3. Architecture cible

L'application comporte six services métier.

| Microservice | Port | Responsabilité |
|---|---|---|
| Auth | 8081 | Authentification et comptes |
| Catalog | 8082 | Consultation des produits |
| Inventory | 8083 | Gestion et réservation des stocks |
| Orders | 8084 | Création et gestion des commandes |
| Payments | 8085 | Simulation des paiements |
| Shipping | 8086 | Expédition et suivi |

Chaque service possède sa propre API REST et doit pouvoir être exécuté indépendamment.

## 4. Configuration

Ouvrez `src/config/backend.js`.

Exemple pour connecter uniquement Catalog :

```javascript
const BACKEND_MODE = {
  AUTH: "mock",
  CATALOG: "rest",
  INVENTORY: "mock",
  ORDERS: "mock",
  PAYMENTS: "mock",
  SHIPPING: "mock"
};
```

L'adresse du service Catalog doit correspondre à celle définie dans `API_URLS.CATALOG`.

**Attention :** les services ne sont pas tous indépendants fonctionnellement. Lorsqu'un service REST doit communiquer avec un autre microservice, les dépendances correspondantes doivent également être disponibles.

## 5. Contrats REST

### Auth — Port 8081

| Méthode | Endpoint |
|---|---|
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |

La connexion retourne un objet contenant `user` et `token`.

### Catalog — Port 8082

| Méthode | Endpoint |
|---|---|
| GET | `/products` |
| GET | `/products/{id}` |

Un produit contient `id`, `name`, `category`, `price`, `image` et `description`.

### Inventory — Port 8083

| Méthode | Endpoint |
|---|---|
| GET | `/api/inventory/{productId}` |
| POST | `/api/inventory/check` |
| POST | `/api/inventory/reserve` |
| POST | `/api/inventory/release` |

Exemple de requête :

```json
{
  "items": [
    {"productId": 1, "quantity": 2}
  ]
}
```

Réponse de vérification :

```json
{"available": true}
```

Réponse de réservation :

```json
{"success": true}
```

La réservation doit être atomique : aucun stock ne doit être modifié si la réservation complète est impossible.

### Orders — Port 8084

| Méthode | Endpoint |
|---|---|
| GET | `/api/orders?userId={id}` |
| GET | `/api/orders/{id}` |
| POST | `/api/orders` |
| PATCH | `/api/orders/{id}/status` |
| POST | `/api/orders/{id}/cancel` |

Création d'une commande :

```json
{
  "userId": "user-1",
  "customer": {
    "name": "Demo Customer",
    "address": "123 Main Street",
    "city": "Casablanca"
  },
  "items": [
    {"productId": 1, "quantity": 2}
  ]
}
```

La réponse doit contenir `id`, `userId`, `customer`, `items`, `total`, `status` et `createdAt`.

Le service Orders doit communiquer avec Inventory pour réserver les produits et libérer le stock lors d'une annulation autorisée.

### Payments — Port 8085

| Méthode | Endpoint |
|---|---|
| GET | `/api/payments` |
| GET | `/api/payments/order/{orderId}` |
| POST | `/api/payments` |

Requête :

```json
{
  "orderId": "order-123",
  "method": "CARD"
}
```

La simulation d'un paiement réussi retourne un paiement avec le statut `SUCCESS` et entraîne le passage de la commande à `PAID`.

### Shipping — Port 8086

| Méthode | Endpoint |
|---|---|
| GET | `/api/shipments` |
| GET | `/api/shipments/order/{orderId}` |
| POST | `/api/shipments` |
| PATCH | `/api/shipments/{id}/status` |

Création :

```json
{
  "orderId": "order-123",
  "address": {
    "name": "Demo Customer",
    "address": "123 Main Street",
    "city": "Casablanca"
  }
}
```

États d'expédition :

`PREPARING → SHIPPED → IN_TRANSIT → DELIVERED`

Le suivi d'expédition doit rester cohérent avec l'état de la commande.

## 6. Travail demandé

1. Identifier les responsabilités et les frontières de chaque microservice.
2. Implémenter les endpoints REST en respectant les contrats.
3. Configurer CORS pour autoriser le frontend Vite.
4. Connecter progressivement les services en modifiant `backend.js`.
5. Implémenter les communications nécessaires entre microservices.
6. Vérifier les scénarios métier et documenter les résultats.

## 7. Critères de validation

- Les produits s'affichent depuis Catalog.
- Inventory empêche toute réservation dépassant le stock disponible.
- Une commande réserve correctement les produits.
- Un paiement réussi met la commande à l'état `PAID`.
- Une annulation autorisée restaure le stock.
- Une commande expédiée ne peut plus être annulée.
- Le suivi de livraison respecte les transitions autorisées.
- Les commandes sont associées au bon utilisateur.
- Les erreurs REST sont correctement retournées et traitées.

## 8. Contraintes

- Respecter les méthodes HTTP, les chemins et les structures JSON.
- Ne pas modifier les composants React.
- Ne pas utiliser les données du frontend comme source de vérité pour les prix, les stocks ou les autorisations.
- Ne pas stocker de mots de passe en clair dans un backend réel.
- Chaque microservice doit contrôler les opérations relevant de sa responsabilité.

**Livrables :** code source des microservices, instructions de lancement, description des communications interservices et preuves des tests effectués.