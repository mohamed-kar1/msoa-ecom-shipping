import json
import os
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timezone

import httpx
from fastapi import Depends, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

DB_PATH = os.getenv("DB_PATH", "shipping.db")
ORDERS_URL = os.getenv("ORDERS_URL", "http://localhost:8084")
AUTH_URL = os.getenv("AUTH_URL", "http://localhost:8081")
# MOCK_ORDERS=true : on ne contacte pas Orders (développement avant que Orders soit prêt)
MOCK_ORDERS = os.getenv("MOCK_ORDERS", "false").lower() == "true"
# REQUIRE_AUTH=true : le JWT est validé auprès du service Auth
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"
HTTP_TIMEOUT = 5

# Machine à états : PREPARING -> SHIPPED -> IN_TRANSIT -> DELIVERED
# (annulation possible uniquement depuis PREPARING, comme le mock du frontend)
ALLOWED = {
    "PREPARING": ["SHIPPED", "CANCELLED"],
    "SHIPPED": ["IN_TRANSIT"],
    "IN_TRANSIT": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": [],
}
# Statut de commande à répercuter dans Orders (cohérence suivi <-> commande)
ORDER_SYNC = {"SHIPPED": "SHIPPED", "DELIVERED": "DELIVERED"}


# ---------- Base de données ----------
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_db():
    with closing(get_conn()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL,
                tracking_number TEXT NOT NULL,
                carrier TEXT,
                address TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS shipment_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                at TEXT NOT NULL
            );
            """
        )
        conn.commit()


init_db()


def to_dict(conn, row):
    events = conn.execute(
        "SELECT status, at FROM shipment_events WHERE shipment_id = ? ORDER BY id", (row["id"],)
    ).fetchall()
    return {
        "id": row["id"],
        "orderId": row["order_id"],
        "status": row["status"],
        "trackingNumber": row["tracking_number"],
        "carrier": row["carrier"],
        "address": json.loads(row["address"]) if row["address"] else None,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "history": [dict(e) for e in events],
    }


# ---------- Appplication ----------
app = FastAPI(title="Shipping Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Toutes les erreurs au format { "message": "..." }
@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"message": str(exc.detail)})


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"message": "Invalid request body"})


def auth(authorization: str | None = Header(default=None)):
    """Valide le JWT auprès du service Auth (si REQUIRE_AUTH=true) et renvoie l'en-tête."""
    if not REQUIRE_AUTH:
        return authorization
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid token")
    try:
        r = httpx.get(f"{AUTH_URL}/api/auth/me", headers={"Authorization": authorization}, timeout=HTTP_TIMEOUT)
    except httpx.HTTPError:
        raise HTTPException(503, "Auth service unavailable")
    if r.status_code != 200:
        raise HTTPException(401, "Invalid token")
    return authorization


def fwd(authorization):
    return {"Authorization": authorization} if authorization else {}


def fetch_order(order_id, authorization):
    if MOCK_ORDERS:
        return {"id": order_id, "status": "PAID"}
    try:
        r = httpx.get(f"{ORDERS_URL}/api/orders/{order_id}", headers=fwd(authorization), timeout=HTTP_TIMEOUT)
    except httpx.HTTPError:
        raise HTTPException(503, "Orders service unavailable")
    if r.status_code == 404:
        raise HTTPException(404, "Order not found")
    if r.status_code != 200:
        raise HTTPException(502, f"Orders service error ({r.status_code})")
    return r.json()


def sync_order_status(order_id, status, authorization):
    if MOCK_ORDERS:
        return
    try:
        r = httpx.patch(
            f"{ORDERS_URL}/api/orders/{order_id}/status",
            json={"status": status},
            headers=fwd(authorization),
            timeout=HTTP_TIMEOUT,
        )
    except httpx.HTTPError:
        raise HTTPException(503, "Orders service unavailable")
    if r.status_code >= 300:
        raise HTTPException(502, f"Orders refused status {status} ({r.status_code})")


# ---------- Modèles ----------
class ShipmentIn(BaseModel):
    orderId: int | str
    address: dict | str | None = None
    carrier: str | None = None


class StatusIn(BaseModel):
    status: str


# ---------- Routes ----------
@app.get("/health")
def health():
    return {"status": "UP", "service": "shipping"}


@app.get("/api/shipments")
def list_shipments(_: str | None = Depends(auth)):
    with closing(get_conn()) as conn:
        rows = conn.execute("SELECT * FROM shipments ORDER BY id").fetchall()
        return [to_dict(conn, r) for r in rows]


@app.get("/api/shipments/order/{order_id}")
def get_by_order(order_id: str, _: str | None = Depends(auth)):
    with closing(get_conn()) as conn:
        row = conn.execute("SELECT * FROM shipments WHERE order_id = ?", (order_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Shipment not found")
        return to_dict(conn, row)


@app.post("/api/shipments", status_code=201)
def create_shipment(body: ShipmentIn, authorization: str | None = Depends(auth)):
    order_id = str(body.orderId)

    with closing(get_conn()) as conn:
        if conn.execute("SELECT 1 FROM shipments WHERE order_id = ?", (order_id,)).fetchone():
            raise HTTPException(409, "A shipment already exists for this order")

    order = fetch_order(order_id, authorization)
    if order.get("status") != "PAID":
        raise HTTPException(409, "Order must be PAID before shipping")

    address = body.address
    if address is not None:
        address = json.dumps(address)

    ts = now()
    tracking = "TRK" + uuid.uuid4().hex[:10].upper()
    with closing(get_conn()) as conn:
        try:
            cur = conn.execute(
                """INSERT INTO shipments (order_id, status, tracking_number, carrier, address, created_at, updated_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (order_id, "PREPARING", tracking, body.carrier, address, ts, ts),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(409, "A shipment already exists for this order")
        conn.execute(
            "INSERT INTO shipment_events (shipment_id, status, at) VALUES (?,?,?)",
            (cur.lastrowid, "PREPARING", ts),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM shipments WHERE id = ?", (cur.lastrowid,)).fetchone()
        return to_dict(conn, row)


@app.patch("/api/shipments/{shipment_id}/status")
def update_status(shipment_id: int, body: StatusIn, authorization: str | None = Depends(auth)):
    new_status = body.status.upper()
    if new_status not in ALLOWED:
        raise HTTPException(400, f"Unknown status: {body.status}")

    with closing(get_conn()) as conn:
        row = conn.execute("SELECT * FROM shipments WHERE id = ?", (shipment_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Shipment not found")

        current = row["status"]
        if new_status not in ALLOWED[current]:
            raise HTTPException(409, f"Invalid transition {current} -> {new_status}")

        # Cohérence avec la commande : si Orders refuse, on ne change rien ici
        if new_status in ORDER_SYNC:
            sync_order_status(row["order_id"], ORDER_SYNC[new_status], authorization)

        ts = now()
        conn.execute("UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?", (new_status, ts, shipment_id))
        conn.execute(
            "INSERT INTO shipment_events (shipment_id, status, at) VALUES (?,?,?)", (shipment_id, new_status, ts)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM shipments WHERE id = ?", (shipment_id,)).fetchone()
        return to_dict(conn, row)
