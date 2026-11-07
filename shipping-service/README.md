# Shipping Service (port 8086)

FastAPI + SQLite (`shipping.db`, créée automatiquement).

## Lancement

```powershell
pip install -r requirements.txt
python -m uvicorn main:app --port 8086 --reload
```

Par défaut, Shipping contacte le vrai service Orders (`http://localhost:8084`, modifiable avec `ORDERS_URL`).

Si Orders n'est pas encore prêt, ajoutez cette ligne avant la commande de lancement :

```powershell
$env:MOCK_ORDERS="true"
```

Pour revenir au vrai Orders dans le même terminal :

```powershell
Remove-Item Env:MOCK_ORDERS
```

Côté frontend, dans `src/config/backend.js` : `SHIPPING: "rest"`.

## Endpoints

- `GET /api/shipments`
- `GET /api/shipments/order/{orderId}`
- `POST /api/shipments` : `{"orderId": "order-123", "address": {"name": "...", "address": "...", "city": "..."}}`
- `PATCH /api/shipments/{id}/status` : `{"status": "SHIPPED"}`

## Règles

- La commande doit être `PAID` pour créer une expédition. Une seule par commande.
- Statuts : `PREPARING → SHIPPED → IN_TRANSIT → DELIVERED`, sans saut (409). `CANCELLED` possible depuis `PREPARING`.
- `SHIPPED` et `DELIVERED` sont répercutés dans Orders.
- Erreurs : `{"message": "..."}`.

## Communications interservices

| De → vers | Appel | Pourquoi |
|---|---|---|
| Frontend → Shipping | `POST /api/shipments` | Créer l'expédition après le paiement |
| Frontend → Shipping | `PATCH /api/shipments/{id}/status` | Faire avancer le suivi |
| Shipping → Orders | `GET /api/orders/{id}` | Vérifier que la commande existe et est `PAID` |
| Shipping → Orders | `PATCH /api/orders/{id}/status` | Répercuter `SHIPPED` et `DELIVERED` |
| Orders → Shipping | `GET /api/shipments/order/{id}` | Vérifier que l'expédition est en `PREPARING` avant d'annuler |