import os
import asyncio
from datetime import datetime, time as dtime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

app = FastAPI(title="AI Master Trader - MT5/Alice Blue Quant Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# In-Memory Real-Time State for MT5-style processing
QUANT_STATE = {
    "symbol": "AI_GLOBAL",
    "price": 6700.57,
    "orb_high": 6702.40,
    "orb_low": 6698.80,
    "vwap": 6700.10,
    "rsi": 52.0,
    "candles_5m": [],
    "recent_signal": "WAITING_FOR_ORB_BREAKOUT",
    "daily_pnl": 0.0,
    "active_orders": []
}

def get_db():
    if not DATABASE_URL:
        return None
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def send_telegram_alert(msg: str):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "Markdown"}, timeout=4)
    except Exception as e:
        print(f"Telegram error: {e}")

# 1. MT5 / Alice Blue Risk & Charges Math
def calculate_charges(buy_p: float, sell_p: float, qty: int = 1):
    turnover = (buy_p + sell_p) * qty
    brokerage = min(40.0, turnover * 0.0005) # Alice Blue / Zerodha standard
    stt = sell_p * qty * 0.00025
    exchange_charges = turnover * 0.0000345
    gst = (brokerage + exchange_charges) * 0.18
    return round(brokerage + stt + exchange_charges + gst, 2)

def log_trade_to_neon(symbol, direction, entry, amount, reason="ORB Autonomous Breakout"):
    try:
        conn = get_db()
        if conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO orders (symbol, direction, entry_price, quantity, amount, status, exit_reason, is_paper)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                    """,
                    (symbol, direction, entry, 1, amount, 'OPEN', reason, True)
                )
                order_id = cur.fetchone()["id"]
                conn.commit()
            conn.close()
            return order_id
    except Exception as e:
        print(f"Neon order log error: {e}")
    return int(datetime.utcnow().timestamp() * 1000)

# 2. Autonomous Quant Engine Background Daemon (Alice Blue / ORB Logic)
async def run_quant_engine():
    print(">>> MT5 / Alice Blue Quant Engine Daemon Started <<<")
    while True:
        try:
            # Micro-tick price engine
            delta = (hash(str(datetime.utcnow())) % 11 - 5.0) * 0.08
            QUANT_STATE["price"] = round(QUANT_STATE["price"] + delta, 4)
            current_p = QUANT_STATE["price"]

            # Maintain simulated 5-minute candle aggregation
            if len(QUANT_STATE["candles_5m"]) == 0 or len(QUANT_STATE["candles_5m"]) > 30:
                QUANT_STATE["candles_5m"] = [current_p] * 14

            QUANT_STATE["candles_5m"].append(current_p)
            if len(QUANT_STATE["candles_5m"]) > 14:
                QUANT_STATE["candles_5m"].pop(0)

            # RSI(14)
            diffs = [QUANT_STATE["candles_5m"][i] - QUANT_STATE["candles_5m"][i-1] for i in range(1, len(QUANT_STATE["candles_5m"]))]
            gains = [d for d in diffs if d > 0]
            losses = [abs(d) for d in diffs if d < 0]
            avg_g = sum(gains) / 14 if gains else 0.0001
            avg_l = sum(losses) / 14 if losses else 0.0001
            rs = avg_g / avg_l
            QUANT_STATE["rsi"] = round(100 - (100 / (1 + rs)), 2)

            # ORB Breakout Strategy Execution Engine:
            # Long: Current Price breaks above ORB High AND RSI > 55
            # Short: Current Price breaks below ORB Low AND RSI < 45
            if current_p > QUANT_STATE["orb_high"] and QUANT_STATE["rsi"] > 55:
                QUANT_STATE["recent_signal"] = "BULLISH_ORB_TRIGGERED"
                if len(QUANT_STATE["active_orders"]) == 0:
                    oid = log_trade_to_neon(QUANT_STATE["symbol"], "BUY/CALL", current_p, 70.0, "15m ORB High Breakout + RSI Expansion")
                    QUANT_STATE["active_orders"].append({"id": oid, "entry": current_p, "dir": "CALL", "timer": 15})
                    send_telegram_alert(f"🚀 *ALICE BLUE / ORB AUTO-TRADE*\nSymbol: `{QUANT_STATE['symbol']}`\nSignal: `BUY / CALL BREAKOUT`\nEntry: `{current_p}`\nORB High: `{QUANT_STATE['orb_high']}`")

            elif current_p < QUANT_STATE["orb_low"] and QUANT_STATE["rsi"] < 45:
                QUANT_STATE["recent_signal"] = "BEARISH_ORB_TRIGGERED"
                if len(QUANT_STATE["active_orders"]) == 0:
                    oid = log_trade_to_neon(QUANT_STATE["symbol"], "SELL/PUT", current_p, 70.0, "15m ORB Low Breakdown + RSI Compression")
                    QUANT_STATE["active_orders"].append({"id": oid, "entry": current_p, "dir": "PUT", "timer": 15})
                    send_telegram_alert(f"🔻 *ALICE BLUE / ORB AUTO-TRADE*\nSymbol: `{QUANT_STATE['symbol']}`\nSignal: `SELL / PUT BREAKDOWN`\nEntry: `{current_p}`\nORB Low: `{QUANT_STATE['orb_low']}`")

            # Manage active order durations & automatic target square-offs
            for o in QUANT_STATE["active_orders"]:
                o["timer"] -= 1
            QUANT_STATE["active_orders"] = [o for o in QUANT_STATE["active_orders"] if o["timer"] > 0]

        except Exception as e:
            print(f"Quant loop error: {e}")

        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_quant_engine())

class OrderRequest(BaseModel):
    symbol: str
    direction: str
    amount: float
    entry_price: float
    duration_sec: int = 15

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "service": "MT5 / Alice Blue Quant Engine",
        "telemetry": QUANT_STATE
    }

@app.get("/api/health")
def health():
    return {"status": "ONLINE", "quant_engine": "ACTIVE", "state": QUANT_STATE}

@app.post("/api/orders/execute")
def execute_order(order: OrderRequest):
    oid = log_trade_to_neon(order.symbol, order.direction, order.entry_price, order.amount, "Manual / Web Terminal Trigger")
    return {"status": "EXECUTED", "order_id": oid, "mode": "PAPER"}

@app.websocket("/ws")
async def websocket_ticks(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = {
                "time": int(datetime.utcnow().timestamp()),
                "symbol": QUANT_STATE["symbol"],
                "price": QUANT_STATE["price"],
                "rsi": QUANT_STATE["rsi"],
                "orb_high": QUANT_STATE["orb_high"],
                "orb_low": QUANT_STATE["orb_low"],
                "signal": QUANT_STATE["recent_signal"],
                "active_trades": len(QUANT_STATE["active_orders"])
            }
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass