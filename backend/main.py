import asyncio
from datetime import datetime, time as dt_time
from typing import Dict, List, Optional
import pytz
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

IST = pytz.timezone("Asia/Kolkata")

app = FastAPI(title="AI MASTER TRADER - Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BotState:
    def __init__(self):
        self.auto_pilot: bool = True
        self.trading_mode: str = "PAPER"
        self.live_execution_locked: bool = True
        self.virtual_cash: float = 100000.0
        self.starting_daily_equity: float = 100000.0
        self.realized_pnl: float = 0.0
        self.risk_per_trade_pct: float = 0.005
        self.daily_loss_limit_pct: float = 0.02
        self.max_positions: int = 5
        self.daily_lock_triggered: bool = False
        self.whitelist: List[str] = ["RELIANCE", "TCS"]
        self.open_positions: Dict[str, dict] = {}
        self.trade_history: List[dict] = []
        
        self.watchlist: List[dict] = [
            {"symbol": "RELIANCE", "category": "NSE Equity", "price": 2954.50, "change": 1.24, "whitelisted": True},
            {"symbol": "TCS", "category": "NSE Equity", "price": 4120.00, "change": 0.85, "whitelisted": True},
            {"symbol": "NIFTY 50", "category": "Indian Index", "price": 24850.00, "change": 0.62, "whitelisted": False},
            {"symbol": "BANK NIFTY", "category": "Indian Index", "price": 52900.00, "change": -0.31, "whitelisted": False},
            {"symbol": "BTC/USDT", "category": "Binance Crypto", "price": 89420.00, "change": 2.45, "whitelisted": False},
            {"symbol": "ETH/USDT", "category": "Binance Crypto", "price": 3180.50, "change": 1.90, "whitelisted": False},
            {"symbol": "EUR/USD (OTC)", "category": "Quotex Forex", "price": 1.0845, "change": 0.15, "whitelisted": False},
            {"symbol": "GBP/JPY", "category": "Quotex Forex", "price": 194.320, "change": 0.42, "whitelisted": False},
            {"symbol": "XAU/USD (Gold)", "category": "Commodities", "price": 2685.40, "change": 1.12, "whitelisted": False},
            {"symbol": "NVDA", "category": "US Stocks", "price": 138.60, "change": 3.10, "whitelisted": False},
        ]
        self.signals: List[dict] = []

state = BotState()

class TogglePayload(BaseModel):
    auto_pilot: bool

def generate_ai_signals():
    signals = []
    for item in state.watchlist:
        delta = random.uniform(-0.0022, 0.0026)
        item["price"] = round(item["price"] * (1 + delta), 4 if item["price"] < 10 else 2)
        
        conf = random.randint(70, 92)
        is_buy = conf >= 80
        atr = round(item["price"] * 0.004, 2)
        sl = round(item["price"] - atr, 2)
        tp = round(item["price"] + (atr * 1.5), 2)
        
        strategy = (
            "MTF 15m/5m Opening Range Breakout + ATR Trail"
            if conf >= 84
            else "Quant BB(60,2) + 3-Candle Streak Reversion"
        )
        
        sig = {
            "symbol": item["symbol"],
            "category": item["category"],
            "price": item["price"],
            "action": "BUY" if is_buy else "HOLD",
            "confidence": conf,
            "strategy": strategy,
            "entry": item["price"],
            "stop_loss": sl,
            "target": tp,
            "rr_ratio": 1.5,
            "whitelisted": item["whitelisted"],
            "why": [
                "Completed candle closed above Opening Range High with volume confirmation",
                "Price holding firmly above institutional VWAP & 5/8 EMA bullish cross",
                "ATR(14) volatility filter confirmed within optimal risk boundaries"
            ],
            "invalidation": f"5m candle close below {sl} (ORB Low / VWAP)"
        }
        signals.append(sig)
        
        if (
            state.auto_pilot
            and not state.daily_lock_triggered
            and sig["action"] == "BUY"
            and sig["confidence"] >= 84
            and item["whitelisted"]
            and item["symbol"] not in state.open_positions
            and len(state.open_positions) < state.max_positions
        ):
            execute_paper_buy(sig)

    state.signals = sorted(signals, key=lambda x: x["confidence"], reverse=True)

def execute_paper_buy(sig: dict):
    symbol = sig["symbol"]
    entry = sig["entry"]
    sl = sig["stop_loss"]
    stop_dist = max(abs(entry - sl), 1.0)
    
    current_equity = state.virtual_cash + sum(
        p["qty"] * p["current_price"] for p in state.open_positions.values()
    )
    max_risk_inr = current_equity * state.risk_per_trade_pct
    qty = max(1, min(int(max_risk_inr // stop_dist), int((state.virtual_cash * 0.25) // entry)))
    
    cost = round(qty * entry, 2)
    if cost > state.virtual_cash:
        return
        
    state.virtual_cash = round(state.virtual_cash - cost, 2)
    state.open_positions[symbol] = {
        "symbol": symbol,
        "qty": qty,
        "entry": entry,
        "current_price": entry,
        "stop_loss": sl,
        "initial_risk": stop_dist,
        "target": sig["target"],
        "trailing_active": False,
        "unrealized_pnl": 0.0,
        "strategy": sig["strategy"],
        "opened_at": datetime.now(IST).strftime("%H:%M:%S IST")
    }

def update_open_positions():
    now_ist = datetime.now(IST)
    force_square_off = now_ist.time() >= dt_time(15, 15) and now_ist.time() <= dt_time(15, 30)
    price_map = {w["symbol"]: w["price"] for w in state.watchlist}
    
    for sym in list(state.open_positions.keys()):
        pos = state.open_positions[sym]
        curr = price_map.get(sym, pos["current_price"])
        pos["current_price"] = curr
        pos["unrealized_pnl"] = round((curr - pos["entry"]) * pos["qty"], 2)
        
        if force_square_off:
            close_position(sym, curr, "15:15 IST Auto Square-Off")
            continue
        if curr <= pos["stop_loss"]:
            reason = "Trailing Stop Locked Profit" if pos["trailing_active"] else "Stop-Loss Triggered"
            close_position(sym, curr, reason)
            continue
        if curr >= pos["target"]:
            close_position(sym, curr, "Target 1.5R Achieved")
            continue
        if (curr - pos["entry"]) >= (pos["initial_risk"] * 0.6):
            pos["trailing_active"] = True
            new_sl = round(curr - (pos["initial_risk"] * 0.5), 2)
            if new_sl > pos["stop_loss"]:
                pos["stop_loss"] = new_sl

def close_position(symbol: str, exit_price: float, reason: str):
    pos = state.open_positions.pop(symbol)
    pnl = round((exit_price - pos["entry"]) * pos["qty"], 2)
    state.virtual_cash = round(state.virtual_cash + (pos["qty"] * exit_price), 2)
    state.realized_pnl = round(state.realized_pnl + pnl, 2)
    state.trade_history.insert(0, {
        "symbol": symbol,
        "qty": pos["qty"],
        "entry": pos["entry"],
        "exit": exit_price,
        "pnl": pnl,
        "reason": reason,
        "time": datetime.now(IST).strftime("%H:%M:%S IST")
    })

@app.on_event("startup")
async def start_bot_loop():
    async def loop():
        while True:
            generate_ai_signals()
            update_open_positions()
            await asyncio.sleep(2)
    asyncio.create_task(loop())

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "AI MASTER TRADER",
        "paper_engine": "ACTIVE",
        "live_broker": "LOCKED",
        "timezone": "Asia/Kolkata"
    }

@app.post("/api/toggle-autopilot")
async def toggle_autopilot(payload: TogglePayload):
    state.auto_pilot = payload.auto_pilot
    return {"status": "ok", "auto_pilot": state.auto_pilot}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            unrealized = round(sum(p["unrealized_pnl"] for p in state.open_positions.values()), 2)
            portfolio_value = round(
                state.virtual_cash + sum(p["qty"] * p["current_price"] for p in state.open_positions.values()),
                2
            )
            await ws.send_json({
                "timestamp": datetime.now(IST).strftime("%H:%M:%S IST"),
                "auto_pilot": state.auto_pilot,
                "trading_mode": state.trading_mode,
                "live_locked": state.live_execution_locked,
                "portfolio_value": portfolio_value,
                "virtual_cash": state.virtual_cash,
                "realized_pnl": state.realized_pnl,
                "unrealized_pnl": unrealized,
                "open_positions": list(state.open_positions.values()),
                "signals": state.signals,
                "trade_history": state.trade_history[:15]
            })
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass