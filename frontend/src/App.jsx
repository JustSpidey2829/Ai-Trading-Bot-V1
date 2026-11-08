import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Bot,
  Play,
  Pause,
  Sun,
  Moon,
  Monitor,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

const API_HTTP = "http://127.0.0.1:8000";
const API_WS = "ws://127.0.0.1:8000/ws";

export default function App() {
  const [data, setData] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [theme, setTheme] = useState("midnight"); // "midnight" | "graphite" | "day"
  const [activeTab, setActiveTab] = useState("ALL");

  useEffect(() => {
    let ws;
    const connect = () => {
      ws = new WebSocket(API_WS);
      ws.onmessage = (event) => setData(JSON.parse(event.data));
      ws.onclose = () => setTimeout(connect, 1500);
    };
    connect();
    return () => ws && ws.close();
  }, []);

  const toggleAutoPilot = async () => {
    if (!data) return;
    try {
      await fetch(`${API_HTTP}/api/toggle-autopilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_pilot: !data.auto_pilot }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Theme Styling Palettes
  const themeStyles = {
    midnight: {
      bg: "bg-[#0b0e14]",
      panel: "bg-[#111622] border-slate-800/80",
      subPanel: "bg-[#161c2d] border-slate-800",
      text: "text-slate-100",
      textMuted: "text-slate-400",
      cardActive: "bg-[#1a2236] border-emerald-500/80 shadow-emerald-950/40",
      cardInactive: "bg-[#111622]/80 border-slate-800/70 hover:border-slate-700",
      accent: "text-emerald-400",
    },
    graphite: {
      bg: "bg-[#181a1f]",
      panel: "bg-[#21242b] border-zinc-700/70",
      subPanel: "bg-[#282c34] border-zinc-700",
      text: "text-zinc-100",
      textMuted: "text-zinc-400",
      cardActive: "bg-[#2c313c] border-cyan-400 shadow-cyan-950/40",
      cardInactive: "bg-[#21242b] border-zinc-700/60 hover:border-zinc-600",
      accent: "text-cyan-400",
    },
    day: {
      bg: "bg-[#f4f6f9]",
      panel: "bg-white border-slate-200 shadow-sm",
      subPanel: "bg-slate-50 border-slate-200",
      text: "text-slate-900",
      textMuted: "text-slate-500",
      cardActive: "bg-emerald-50/80 border-emerald-600 shadow-sm",
      cardInactive: "bg-white border-slate-200 hover:border-slate-300",
      accent: "text-emerald-700",
    },
  }[theme];

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <Bot className="h-6 w-6 text-emerald-400 absolute" />
        </div>
        <h1 className="text-xl font-bold mt-4 tracking-wide text-emerald-400">
          AI MASTER TRADER
        </h1>
        <p className="text-xs text-slate-400 mt-1 animate-pulse">
          Connecting to Python Quant Engine on 127.0.0.1:8000...
        </p>
      </div>
    );
  }

  const activeSignal =
    data.signals.find((s) => s.symbol === selectedSymbol) || data.signals[0];

  const filteredSignals =
    activeTab === "ALL"
      ? data.signals
      : activeTab === "WHITELIST"
      ? data.signals.filter((s) => s.whitelisted)
      : data.signals.filter((s) => s.category.includes(activeTab));

  return (
    <div
      className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} transition-colors duration-200 font-sans p-2.5 md:p-4`}
    >
      {/* ======================================================== */}
      {/* 1. TOP QUOTEX HUD & TELEMETRY HEADER                     */}
      {/* ======================================================== */}
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl p-3.5 mb-3.5 ${themeStyles.panel}`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Bot className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg tracking-tight">
                AI MASTER TRADER
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PAPER ACTIVE
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                LIVE LOCKED
              </span>
            </div>
            <div className={`text-[11px] ${themeStyles.textMuted}`}>
              Groww + Upstox Dual Adapter • Square-Off: 15:15 IST • Modulo Synced
            </div>
          </div>
        </div>

        {/* PORTFOLIO & TELEMETRY STRIP */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="border-r border-slate-700/40 pr-4">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.textMuted}`}>
              Demo Equity
            </div>
            <div className="text-base font-extrabold">
              ₹{data.portfolio_value.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="border-r border-slate-700/40 pr-4">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.textMuted}`}>
              Cash Available
            </div>
            <div className="text-base font-semibold">
              ₹{data.virtual_cash.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="border-r border-slate-700/40 pr-4">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.textMuted}`}>
              Unrealized P&L
            </div>
            <div
              className={`text-base font-extrabold flex items-center gap-1 ${
                data.unrealized_pnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {data.unrealized_pnl >= 0 ? "+" : ""}₹{data.unrealized_pnl}
            </div>
          </div>

          <div className="border-r border-slate-700/40 pr-4">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.textMuted}`}>
              Realized P&L
            </div>
            <div
              className={`text-base font-extrabold ${
                data.realized_pnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {data.realized_pnl >= 0 ? "+" : ""}₹{data.realized_pnl}
            </div>
          </div>

          {/* 1-CLICK AI AUTOPILOT TOGGLE */}
          <button
            onClick={toggleAutoPilot}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs shadow-md transition transform active:scale-95 ${
              data.auto_pilot
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }`}
          >
            {data.auto_pilot ? (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> AUTOPILOT: ON
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" /> AUTOPILOT: PAUSED
              </>
            )}
          </button>

          {/* USER THEME SELECTOR */}
          <div
            className={`flex items-center rounded-lg p-1 border ${themeStyles.subPanel}`}
          >
            <button
              onClick={() => setTheme("midnight")}
              title="Quotex Midnight"
              className={`p-1.5 rounded ${
                theme === "midnight"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : themeStyles.textMuted
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme("graphite")}
              title="Graphite Dark"
              className={`p-1.5 rounded ${
                theme === "graphite"
                  ? "bg-cyan-400 text-slate-950 font-bold"
                  : themeStyles.textMuted
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme("day")}
              title="Day Light"
              className={`p-1.5 rounded ${
                theme === "day"
                  ? "bg-emerald-600 text-white font-bold"
                  : themeStyles.textMuted
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN 3-ZONE TERMINAL GRID                             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT PANEL: MULTI-MARKET SCANNER & WATCHLIST */}
        <div className={`lg:col-span-3 border rounded-xl p-3.5 flex flex-col ${themeStyles.panel}`}>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider">
              Market Scanner
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">
              {data.timestamp}
            </span>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex gap-1 mb-2.5 text-[10px] font-bold overflow-x-auto pb-1">
            {["ALL", "WHITELIST", "NSE", "Crypto", "Forex"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 rounded transition ${
                  activeTab === tab
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : `${themeStyles.textMuted} hover:text-white`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* WATCHLIST ITEMS */}
          <div className="space-y-1.5 overflow-y-auto max-h-[560px] pr-1">
            {filteredSignals.map((item) => (
              <div
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`p-2.5 rounded-lg cursor-pointer border transition ${
                  selectedSymbol === item.symbol
                    ? themeStyles.cardActive
                    : themeStyles.cardInactive
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      {item.symbol}
                      {item.whitelisted && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">
                          WL
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${themeStyles.textMuted}`}>
                      {item.category}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-bold">
                      {typeof item.price === "number" ? item.price.toFixed(item.price < 10 ? 4 : 2) : item.price}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        item.action === "BUY"
                          ? "text-emerald-400"
                          : themeStyles.textMuted
                      }`}
                    >
                      {item.action} • {item.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: QUOTEX ACTION TERMINAL & ACTIVE POSITIONS */}
        <div className="lg:col-span-6 space-y-3.5">
          {activeSignal && (
            <div className={`border rounded-xl p-4 md:p-5 ${themeStyles.panel}`}>
              {/* ASSET TITLE & CONFIDENCE GAUGE */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> {activeSignal.strategy}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5">
                    {activeSignal.symbol}{" "}
                    <span className="text-sm font-mono font-medium text-slate-400">
                      ₹{activeSignal.price}
                    </span>
                  </h3>
                </div>

                <div className="text-right">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${themeStyles.textMuted}`}>
                    AI Win Expectancy
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    {activeSignal.confidence}%{" "}
                    <span className="text-xs uppercase font-bold text-slate-300">
                      ({activeSignal.action})
                    </span>
                  </div>
                </div>
              </div>

              {/* THREE-POINT ORDER LEVEL CARDS */}
              <div className="grid grid-cols-3 gap-2.5 my-3.5">
                <div className={`p-2.5 rounded-lg border ${themeStyles.subPanel}`}>
                  <div className={`text-[10px] font-bold ${themeStyles.textMuted}`}>
                    ENTRY PRICE
                  </div>
                  <div className="text-sm md:text-base font-extrabold mt-0.5">
                    {activeSignal.entry}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border border-rose-500/30 ${themeStyles.subPanel}`}>
                  <div className="text-[10px] font-bold text-rose-400">
                    STOP LOSS (0.5%)
                  </div>
                  <div className="text-sm md:text-base font-extrabold text-rose-400 mt-0.5">
                    {activeSignal.stop_loss}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border border-emerald-500/30 ${themeStyles.subPanel}`}>
                  <div className="text-[10px] font-bold text-emerald-400">
                    TARGET (1.5R + TRAIL)
                  </div>
                  <div className="text-sm md:text-base font-extrabold text-emerald-400 mt-0.5">
                    {activeSignal.target}
                  </div>
                </div>
              </div>

              {/* EXPLAINABLE AI REASONING (ONE-GLANCE FOR NEWBIES) */}
              <div className={`rounded-lg p-3 border text-xs space-y-1.5 ${themeStyles.subPanel}`}>
                <div className="font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Why AI Selected This Trade:
                </div>
                <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                  {activeSignal.why.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <div className="text-[10px] text-amber-400/90 pt-1 border-t border-slate-700/50">
                  <span className="font-bold">Invalidation Condition:</span>{" "}
                  {activeSignal.invalidation}
                </div>
              </div>
            </div>
          )}

          {/* OPEN AUTOMATED PAPER POSITIONS */}
          <div className={`border rounded-xl p-3.5 ${themeStyles.panel}`}>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Open Automated Positions ({data.open_positions.length} / 5 Max)
              </h3>
              <span className="text-[10px] text-slate-400">
                0.5% Capital Allocation / Trade
              </span>
            </div>

            {data.open_positions.length === 0 ? (
              <div className={`text-center py-6 border border-dashed rounded-lg ${themeStyles.subPanel}`}>
                <Activity className="h-6 w-6 mx-auto text-slate-500 mb-1 animate-pulse" />
                <p className={`text-xs ${themeStyles.textMuted}`}>
                  Scanner watching RELIANCE & TCS for completed-candle breakout...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.open_positions.map((pos) => (
                  <div
                    key={pos.symbol}
                    className={`flex flex-wrap items-center justify-between p-2.5 rounded-lg border text-xs ${themeStyles.subPanel}`}
                  >
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {pos.symbol}
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                          Qty: {pos.qty}
                        </span>
                        {pos.trailing_active && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 rounded animate-pulse">
                            🔥 Trailing Active
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${themeStyles.textMuted}`}>
                        Entry: ₹{pos.entry} • SL: ₹{pos.stop_loss} • TP: ₹{pos.target} • {pos.opened_at}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-black ${
                          pos.unrealized_pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {pos.unrealized_pnl >= 0 ? "+" : ""}₹{pos.unrealized_pnl}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SAFETY SHIELD & RECENT TRADE HISTORY */}
        <div className={`lg:col-span-3 space-y-3.5`}>
          {/* HARD RISK CONTROLS */}
          <div className={`border rounded-xl p-3.5 ${themeStyles.panel}`}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Capital Shield (SEBI / Prop Rules)
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-700/30">
                <span className={themeStyles.textMuted}>Risk Per Trade:</span>
                <span className="font-bold text-emerald-400">0.5% (₹500 Max)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/30">
                <span className={themeStyles.textMuted}>Daily Loss Lock:</span>
                <span className="font-bold text-rose-400">2.0% (₹2,000 Cap)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/30">
                <span className={themeStyles.textMuted}>Auto Square-Off:</span>
                <span className="font-bold text-white">15:15 IST</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/30">
                <span className={themeStyles.textMuted}>Execution Whitelist:</span>
                <span className="font-bold text-white">RELIANCE, TCS</span>
              </div>
              <div className="flex justify-between py-1">
                <span className={themeStyles.textMuted}>Live Broker State:</span>
                <span className="font-bold text-amber-400">LOCKED (Paper Only)</span>
              </div>
            </div>
          </div>

          {/* TRADE HISTORY LOG */}
          <div className={`border rounded-xl p-3.5 ${themeStyles.panel}`}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> Completed Trades
            </h3>
            <div className="space-y-1.5 overflow-y-auto max-h-[360px] pr-1">
              {data.trade_history.length === 0 ? (
                <p className={`text-[11px] text-center py-4 ${themeStyles.textMuted}`}>
                  No closed trades yet today.
                </p>
              ) : (
                data.trade_history.map((t, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded border text-xs ${themeStyles.subPanel}`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>{t.symbol}</span>
                      <span
                        className={
                          t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {t.pnl >= 0 ? "+" : ""}₹{t.pnl}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${themeStyles.textMuted}`}>
                      {t.reason} • {t.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}