import os
import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="AI Master Trader - Quant Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_db():
    if not DATABASE_URL:
        return None
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

class OrderRequest(BaseModel):
    symbol: str
    direction: str
    amount: float
    entry_price: float
    duration_sec: int = 15

@app.get("/")
def root():
    return {"status": "ONLINE", "service": "AI Master Trader Quant Engine"}

@app.get("/api/health")
def health():
    db_connected = False
    try:
        conn = get_db()
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
            conn.close()
            db_connected = True
    except Exception as e:
        print(f"DB check failed: {e}")
    return {"status": "ONLINE", "database_connected": db_connected, "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/orders/execute")
def execute_order(order: OrderRequest):
    order_id = int(datetime.utcnow().timestamp() * 1000)
    try:
        conn = get_db()
        if conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO orders (symbol, direction, entry_price, quantity, amount, is_paper)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
                    """,
                    (order.symbol, order.direction, order.entry_price, 1, order.amount, True)
                )
                res = cur.fetchone()
                if res:
                    order_id = res["id"]
                conn.commit()
            conn.close()
    except Exception as e:
        print(f"Order DB insert error: {e}")

    return {"status": "EXECUTED", "order_id": order_id, "mode": "PAPER"}

@app.websocket("/ws")
async def websocket_ticks(websocket: WebSocket):
    await websocket.accept()
    price = 6700.57
    try:
        while True:
            price = round(price + (hash(str(datetime.utcnow())) % 10 - 4.9) * 0.1, 4)
            payload = {
                "time": int(datetime.utcnow().timestamp()),
                "symbol": "AI_GLOBAL",
                "price": price,
                "rsi": 52.4,
                "ai_edge": 89
            }
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass