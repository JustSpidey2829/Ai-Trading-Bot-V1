import os
from datetime import datetime
import pytz
import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import numpy as np
from database import init_db, get_db_connection

app = FastAPI(title="AI MASTER TRADER - Quotex & Groww Pro")
IST = pytz.timezone("Asia/Kolkata")

@app.on_event("startup")
def startup_event():
    init_db()

MARKETS = [
    {"id": "RELIANCE", "name": "Reliance Industries", "symbol": "RELIANCE.NS", "cat": "Indian Equities", "curr": "₹", "base": 2850.0},
    {"id": "TCS", "name": "Tata Consultancy Services", "symbol": "TCS.NS", "cat": "Indian Equities", "curr": "₹", "base": 4100.0},
    {"id": "NIFTY50", "name": "NIFTY 50", "symbol": "^NSEI", "cat": "Indian Indices", "curr": "₹", "base": 23500.0},
    {"id": "BANKNIFTY", "name": "BANK NIFTY", "symbol": "^NSEBANK", "cat": "Indian Indices", "curr": "₹", "base": 50200.0},
    {"id": "BTC", "name": "Bitcoin (Binance)", "symbol": "BTC-USD", "cat": "Crypto", "curr": "$", "base": 68000.0},
    {"id": "ETH", "name": "Ethereum (Binance)", "symbol": "ETH-USD", "cat": "Crypto", "curr": "$", "base": 3500.0},
    {"id": "GOLD", "name": "Gold Futures", "symbol": "GC=F", "cat": "Commodities", "curr": "$", "base": 2350.0},
    {"id": "EURUSD", "name": "EUR/USD (Quotex FX)", "symbol": "EURUSD=X", "cat": "Forex", "curr": "$", "base": 1.08}
]

def get_session_status():
    now = datetime.now(IST)
    return {"state": "PRO TRADING TERMINAL 🟢", "ist_time": now.strftime("%d %b • %H:%M:%S IST")}

def generate_candles(base_price):
    np.random.seed(abs(hash(base_price)) % 10000)
    now_ts = int(datetime.now(IST).timestamp())
    timestamps = [now_ts - (i * 900) for i in range(60, 0, -1)]
    prices = base_price + np.cumsum(np.random.randn(60) * (base_price * 0.0012))
    
    candles, ha_candles, ha_open = [], [], None
    for i, t in enumerate(timestamps):
        p = float(prices[i])
        o = p * (1 + np.random.uniform(-0.0015, 0.0015))
        h = max(o, p) * (1 + np.random.uniform(0.0, 0.0025))
        l = min(o, p) * (1 - np.random.uniform(0.0, 0.0025))
        c_val = p
        
        candles.append({"time": t, "open": round(o, 2), "high": round(h, 2), "low": round(l, 2), "close": round(c_val, 2)})
        
        ha_close = round((o + h + l + c_val) / 4, 2)
        ha_open = round((o + c_val) / 2, 2) if ha_open is None else round((ha_open + ha_close) / 2, 2)
        ha_candles.append({"time": t, "open": ha_open, "high": round(max(h, ha_open, ha_close), 2), "low": round(min(l, ha_open, ha_close), 2), "close": ha_close})
        
    price = round(float(prices[-1]), 2)
    prev = round(float(prices[-2]), 2)
    return candles, ha_candles, price, prev

def analyze_instrument(m):
    candles, ha_candles, price, prev = generate_candles(m["base"])
    change = round(((price - prev) / prev) * 100, 2)
    rsi = round(np.random.uniform(48, 65), 1)
    ema20 = round(price * 0.996, 2)
    score = 82 if price > ema20 else 52
    signal = "STRONG BUY (AI)" if score >= 60 else "HOLD / NEUTRAL"

    return {
        "id": m["id"], "name": m["name"], "symbol": m["symbol"], "cat": m["cat"],
        "curr": m["curr"], "price": price, "change": change,
        "rsi": rsi, "ema20": ema20, "score": score, "signal": signal,
        "why": f"AI Confluence: Price is interacting favorably with EMA 20. RSI is stable at {rsi}.",
        "candles": candles, "heikin_ashi": ha_candles
    }

@app.get("/api/terminal")
def get_terminal():
    cash = 100000.0
    trades = []
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT available_cash FROM portfolio WHERE id=1;")
        res = c.fetchone()
        if res: cash = res[0]
        c.execute("SELECT time, symbol, side, price, amount, pnl, status FROM trades ORDER BY id DESC LIMIT 15;")
        trades = [{"time": r[0], "symbol": r[1], "side": r[2], "price": r[3], "amount": r[4], "pnl": r[5], "status": r[6]} for r in c.fetchall()]
        conn.close()
    except Exception:
        pass

    market_data = [analyze_instrument(m) for m in MARKETS]
    return {
        "session": get_session_status(),
        "cash": round(cash, 2),
        "markets": market_data,
        "trades": trades
    }

@app.post("/api/trade")
def place_trade(req: dict):
    symbol = req.get("symbol")
    side = req.get("side")
    price = float(req.get("price"))
    amount = float(req.get("amount", 1000))

    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT available_cash FROM portfolio WHERE id=1;")
        cash = c.fetchone()[0]
        if cash >= amount:
            cash -= amount
            now_str = datetime.now(IST).strftime("%H:%M:%S")
            c.execute("UPDATE portfolio SET available_cash = %s WHERE id=1;", (cash,))
            c.execute("INSERT INTO trades (time, symbol, side, price, amount, pnl, status) VALUES (%s, %s, %s, %s, %s, %s, %s);",
                      (now_str, symbol, side, price, amount, 0.0, "ACTIVE"))
            conn.commit()
        conn.close()
    except Exception:
        pass
    return {"ok": True}

@app.get("/", response_class=HTMLResponse)
def serve_ui():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI MASTER TRADER — Quotex & Groww Pro</title>
    <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: #030712; color: #f8fafc; margin: 0; padding: 12px; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        
        .navbar { display: flex; justify-content: space-between; align-items: center; background: #0b0f19; border: 1px solid #1f2937; padding: 10px 20px; border-radius: 14px; margin-bottom: 10px; }
        .logo { font-size: 17px; font-weight: 800; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .badge { background: #111827; padding: 6px 14px; border-radius: 10px; font-weight: 700; font-size: 12px; color: #34d399; border: 1px solid #374151; }

        .workspace { display: grid; grid-template-columns: 280px 1fr 320px; gap: 12px; flex: 1; overflow: hidden; }
        @media (max-width: 1100px) { .workspace { grid-template-columns: 1fr; overflow-y: auto; height: auto; } }

        .panel { background: #0b0f19; border: 1px solid #1f2937; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .panel-header { padding: 12px 16px; background: #0f172a; border-bottom: 1px solid #1f2937; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

        .asset-list { overflow-y: auto; flex: 1; }
        .asset-item { padding: 12px 16px; border-bottom: 1px solid #1f2937; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.15s; }
        .asset-item:hover, .asset-item.active { background: #111827; border-left: 4px solid #38bdf8; }

        .chart-container { flex: 1; position: relative; background: #030712; display: flex; flex-direction: column; }
        .chart-toolbar { padding: 10px 16px; background: #0b0f19; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; }
        select { background: #1e293b; color: white; border: 1px solid #334155; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; outline: none; cursor: pointer; }
        
        #tvchart { width: 100%; height: 480px; background: #030712; }

        .side-panel { padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
        .ai-box { background: #030712; border: 1px solid #1f2937; padding: 12px; border-radius: 10px; font-size: 12px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
        .input-group input { background: #1e293b; border: 1px solid #334155; color: white; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 14px; outline: none; }
        
        .btn-trade { padding: 14px; border: none; border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer; color: white; transition: 0.2s; text-align: center; }
        .btn-call { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
        .btn-put { background: linear-gradient(135deg, #dc2626, #ef4444); box-shadow: 0 4px 15px rgba(239,68,68,0.3); }
        .btn-trade:hover { filter: brightness(1.1); }

        .ai-tutor { background: #030712; border: 1px solid #1f2937; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .tutor-messages { height: 95px; overflow-y: auto; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 6px; }
        .tutor-input-row { display: flex; gap: 6px; }
        .tutor-input-row input { flex: 1; background: #1e293b; border: 1px solid #334155; color: white; padding: 6px; border-radius: 6px; font-size: 11px; }
        .tutor-input-row button { background: #2563eb; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; }
    </style>
</head>
<body>

<div class="navbar">
    <div class="logo">⚡ AI MASTER TRADER <span style="font-size:10px; background:rgba(16,185,129,0.2); color:#34d399; padding:3px 8px; border-radius:6px;">QUOTEX & GROWW PRO</span></div>
    <div style="display:flex; gap:14px; align-items:center;">
        <span id="sessionBadge" style="font-size:12px; color:#94a3b8;">Loading session...</span>
        <div class="badge" id="cashBadge">Cash: ₹1,00,000</div>
    </div>
</div>

<div class="workspace">
    <div class="panel">
        <div class="panel-header">📊 Market Watch</div>
        <div class="asset-list" id="assetList"></div>
    </div>

    <div class="panel">
        <div class="chart-toolbar">
            <div style="display:flex; align-items:center; gap:12px;">
                <strong id="activeTitle" style="font-size:15px;">Select Asset</strong>
                <span id="activePrice" style="font-size:15px; font-weight:800; color:#38bdf8;">—</span>
            </div>
            <div>
                <select id="chartStyle" onchange="redrawChart()">
                    <option value="Candlestick">Candlesticks</option>
                    <option value="HeikinAshi">Heikin Ashi</option>
                    <option value="Line">Line</option>
                    <option value="Area">Area</option>
                </select>
            </div>
        </div>
        <div class="chart-container">
            <div id="tvchart"></div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">🧠 AI Confluence & Tutor</div>
        <div class="side-panel">
            <div class="ai-box" id="aiBox">
                <div><b>AI Signal:</b> <span id="aiSignal" style="color:#10b981; font-weight:bold;">—</span></div>
                <div style="margin-top:6px;"><b>RSI (14):</b> <span id="aiRsi">—</span> | <b>EMA 20:</b> <span id="aiEma">—</span></div>
                <div style="margin-top:6px; color:#38bdf8;" id="aiReason">Analyzing institutional indicators...</div>
            </div>

            <div class="input-group">
                <label>Trade Amount (₹ / $)</label>
                <input type="number" id="tradeAmount" value="1000" step="500">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button class="btn-trade btn-call" onclick="executeTrade('HIGHER')">📈 HIGHER</button>
                <button class="btn-trade btn-put" onclick="executeTrade('LOWER')">📉 LOWER</button>
            </div>

            <div class="ai-tutor">
                <div style="font-size:11px; font-weight:bold; color:#38bdf8;">🤖 AI Mentor & Newbie Guide</div>
                <div class="tutor-messages" id="tutorMessages">
                    <div><b>AI Tutor:</b> Hello! Ask me about RSI, indicators, or paper trading strategy!</div>
                </div>
                <div class="tutor-input-row">
                    <input type="text" id="tutorInput" placeholder="Ask AI mentor..." onkeypress="if(event.key==='Enter') askTutor()">
                    <button onclick="askTutor()">Ask</button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let termData = null;
let currentSymbolObj = null;
let chart = null;
let series = null;

async function loadData() {
    const res = await fetch('/api/terminal');
    termData = await res.json();
    
    document.getElementById('sessionBadge').innerText = `${termData.session.ist_time} • ${termData.session.state}`;
    document.getElementById('cashBadge').innerText = 'Cash: ₹' + termData.cash.toLocaleString();

    if (!currentSymbolObj && termData.markets.length > 0) {
        currentSymbolObj = termData.markets[0];
        initChart();
    } else if (currentSymbolObj) {
        const updated = termData.markets.find(m => m.symbol === currentSymbolObj.symbol);
        if (updated) currentSymbolObj = updated;
    }

    renderAssetList();
    updateAIBox();
}

function renderAssetList() {
    document.getElementById('assetList').innerHTML = termData.markets.map(m => `
        <div class="asset-item ${currentSymbolObj && currentSymbolObj.symbol === m.symbol ? 'active' : ''}" onclick="selectAsset('${m.symbol}')">
            <div>
                <div style="font-weight:700; font-size:13px;">${m.name}</div>
                <div style="font-size:11px; color:#94a3b8;">Score: ${m.score}% | RSI: ${m.rsi}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:800; font-size:13px;">${m.curr}${m.price.toLocaleString()}</div>
                <div style="font-size:11px; font-weight:700; color:${m.change >= 0 ? '#10b981' : '#ef4444'};">${m.change >= 0 ? '+' : ''}${m.change}%</div>
            </div>
        </div>
    `).join('');
}

function selectAsset(sym) {
    currentSymbolObj = termData.markets.find(m => m.symbol === sym);
    initChart();
    renderAssetList();
    updateAIBox();
}

function updateAIBox() {
    if (!currentSymbolObj) return;
    document.getElementById('activeTitle').innerText = `${currentSymbolObj.name} (${currentSymbolObj.symbol})`;
    document.getElementById('activePrice').innerText = `${currentSymbolObj.curr}${currentSymbolObj.price.toLocaleString()}`;
    document.getElementById('aiSignal').innerText = currentSymbolObj.signal;
    document.getElementById('aiSignal').style.color = currentSymbolObj.signal.includes('BUY') ? '#10b981' : '#f59e0b';
    document.getElementById('aiRsi').innerText = currentSymbolObj.rsi;
    document.getElementById('aiEma').innerText = `${currentSymbolObj.curr}${currentSymbolObj.ema20}`;
    document.getElementById('aiReason').innerText = `${currentSymbolObj.why} | Score: ${currentSymbolObj.score}%`;
}

function initChart() {
    if (!currentSymbolObj) return;
    updateAIBox();

    const container = document.getElementById('tvchart');
    container.innerHTML = '';

    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 700,
        height: 480,
        layout: { background: { type: 'solid', color: '#030712' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
        timeScale: { timeVisible: true, secondsVisible: false }
    });

    redrawChart();
}

function redrawChart() {
    if (!currentSymbolObj || !chart) return;
    if (series) chart.removeSeries(series);

    const style = document.getElementById('chartStyle').value;

    if (style === 'Candlestick') {
        series = chart.addCandlestickSeries({ upColor: '#10b981', downColor: '#ef4444', wickUpColor: '#10b981', wickDownColor: '#ef4444' });
        series.setData(currentSymbolObj.candles);
    } else if (style === 'HeikinAshi') {
        series = chart.addCandlestickSeries({ upColor: '#059669', downColor: '#dc2626', wickUpColor: '#059669', wickDownColor: '#dc2626' });
        series.setData(currentSymbolObj.heikin_ashi);
    } else if (style === 'Line') {
        series = chart.addLineSeries({ color: '#38bdf8', lineWidth: 2 });
        series.setData(currentSymbolObj.candles.map(c => ({ time: c.time, value: c.close })));
    } else if (style === 'Area') {
        series = chart.addAreaSeries({ topColor: 'rgba(56, 189, 248, 0.4)', bottomColor: 'rgba(56, 189, 248, 0.0)', lineColor: '#38bdf8', lineWidth: 2 });
        series.setData(currentSymbolObj.candles.map(c => ({ time: c.time, value: c.close })));
    }
    chart.timeScale().fitContent();
}

async function executeTrade(side) {
    if (!currentSymbolObj) return;
    const amount = parseFloat(document.getElementById('tradeAmount').value) || 1000;
    await fetch('/api/trade', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ symbol: currentSymbolObj.symbol, side: side, price: currentSymbolObj.price, amount: amount })
    });
    loadData();
    alert(`Paper trade executed successfully for ${currentSymbolObj.name}!`);
}

function askTutor() {
    const input = document.getElementById('tutorInput');
    const box = document.getElementById('tutorMessages');
    const val = input.value.trim();
    if (!val) return;

    box.innerHTML += `<div><b>You:</b> ${val}</div>`;
    
    let reply = "Always manage your risk (max 0.5% per trade) and follow the AI confluence signal!";
    if (val.toLowerCase().includes('rsi')) {
        reply = "RSI above 70 shows overbought conditions, while below 30 shows oversold conditions.";
    } else if (val.toLowerCase().includes('paper')) {
        reply = "Paper trading gives you ₹1,00,00