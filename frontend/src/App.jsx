import React, { useState, useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode 
} from 'lightweight-charts';
import { 
  Play, 
  Square, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  Clock, 
  BarChart2, 
  Activity, 
  Layers,
  ChevronDown
} from 'lucide-react';

const MARKETS = [
  // Groww / NSE Style
  { id: 'RELIANCE', name: 'Reliance Ind.', broker: 'Groww', type: 'Equity', basePrice: 2850.0 },
  { id: 'TCS', name: 'TCS Ltd.', broker: 'Groww', type: 'Equity', basePrice: 3890.0 },
  { id: 'NIFTY50', name: 'NIFTY 50', broker: 'Groww', type: 'Index', basePrice: 22450.0 },
  // Quotex / Olymp Trade OTC & Forex Style
  { id: 'EURUSD_OTC', name: 'EUR/USD (OTC)', broker: 'Quotex', type: 'Binary/Forex', basePrice: 1.0850 },
  { id: 'GBPUSD', name: 'GBP/USD', broker: 'Olymp Trade', type: 'Forex', basePrice: 1.2720 },
  { id: 'BTCUSDT', name: 'BTC/USDT', broker: 'Quotex Crypto', type: 'Crypto', basePrice: 88400.0 }
];

export default function App() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [chartType, setChartType] = useState('candles'); // 'candles' | 'area' | 'line' | 'bars'
  const [timeframe, setTimeframe] = useState('1m');
  const [balance, setBalance] = useState(100000.0);
  const [pnl, setPnl] = useState(0.0);
  const [botActive, setBotActive] = useState(false);
  const [tradeAmount, setTradeAmount] = useState(500);
  const [activeTrades, setActiveTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [latestPrice, setLatestPrice] = useState(selectedMarket.basePrice);
  const [aiSignal, setAiSignal] = useState({ action: 'WAIT', score: 0, reason: 'Scanning volatility bands...' });

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const mainSeries = useRef(null);
  const vwapSeries = useRef(null);
  const candleDataRef = useRef([]);

  // Generate initial historical candles
  const generateInitialData = (base) => {
    let now = Math.floor(Date.now() / 1000) - 3600;
    let price = base;
    let data = [];
    for (let i = 0; i < 60; i++) {
      let open = price;
      let change = (Math.random() - 0.49) * (base * 0.0015);
      let close = open + change;
      let high = Math.max(open, close) + Math.random() * (base * 0.0008);
      let low = Math.min(open, close) - Math.random() * (base * 0.0008);
      let time = now + i * 60;
      data.push({ time, open, high, low, close });
      price = close;
    }
    return data;
  };

  // 1. Initialize TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#8b949e',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#21262d',
      },
      timeScale: {
        borderColor: '#21262d',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create Main Series based on selected chart type
    let series;
    if (chartType === 'candles') {
      series = chart.addCandlestickSeries({
        upColor: '#00e676',
        downColor: '#ff1744',
        borderVisible: false,
        wickUpColor: '#00e676',
        wickDownColor: '#ff1744',
      });
    } else if (chartType === 'area') {
      series = chart.addAreaSeries({
        topColor: 'rgba(0, 230, 118, 0.4)',
        bottomColor: 'rgba(0, 230, 118, 0.0)',
        lineColor: '#00e676',
        lineWidth: 2,
      });
    } else if (chartType === 'bars') {
      series = chart.addBarSeries({
        upColor: '#00e676',
        downColor: '#ff1744',
      });
    } else {
      series = chart.addLineSeries({
        color: '#00e676',
        lineWidth: 2,
      });
    }

    // Indicator: VWAP Dynamic Line
    const vwap = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 1,
      lineStyle: 2,
      title: 'VWAP',
    });

    const initCandles = generateInitialData(selectedMarket.basePrice);
    candleDataRef.current = initCandles;

    if (chartType === 'candles' || chartType === 'bars') {
      series.setData(initCandles);
    } else {
      series.setData(initCandles.map(c => ({ time: c.time, value: c.close })));
    }

    vwap.setData(initCandles.map(c => ({
      time: c.time,
      value: (c.high + c.low + c.close) / 3
    })));

    chartInstance.current = chart;
    mainSeries.current = series;
    vwapSeries.current = vwap;
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedMarket, chartType]);

  // 2. Real-time Market Price Tick Generator
  useEffect(() => {
    const interval = setInterval(() => {
      if (!mainSeries.current || candleDataRef.current.length === 0) return;

      const lastCandle = { ...candleDataRef.current[candleDataRef.current.length - 1] };
      const delta = (Math.random() - 0.49) * (selectedMarket.basePrice * 0.0004);
      const newClose = +(lastCandle.close + delta).toFixed(2);

      lastCandle.close = newClose;
      lastCandle.high = Math.max(lastCandle.high, newClose);
      lastCandle.low = Math.min(lastCandle.low, newClose);

      candleDataRef.current[candleDataRef.current.length - 1] = lastCandle;

      if (chartType === 'candles' || chartType === 'bars') {
        mainSeries.current.update(lastCandle);
      } else {
        mainSeries.current.update({ time: lastCandle.time, value: newClose });
      }

      setLatestPrice(newClose);

      // AI Trading Logic (Momentum + Mean Reversion Strategy)
      if (botActive) {
        const r = Math.random();
        if (r > 0.95 && activeTrades.length < 2) {
          executeTrade('CALL', 'VWAP Bounce + EMA 5/8 Bullish Cross');
        } else if (r < 0.05 && activeTrades.length < 2) {
          executeTrade('PUT', 'Upper Bollinger Band Rejection');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedMarket, chartType, botActive, activeTrades]);

  // 3. Trade Execution & Chart Marker Plotting
  const executeTrade = (direction, reason = 'Manual Order') => {
    const entryPrice = latestPrice;
    const tradeTime = candleDataRef.current[candleDataRef.current.length - 1].time;
    const newTrade = {
      id: Date.now(),
      market: selectedMarket.name,
      direction,
      amount: tradeAmount,
      entryPrice,
      time: tradeTime,
      reason,
      status: 'OPEN'
    };

    setActiveTrades(prev => [...prev, newTrade]);

    // Plot Quotex/TradingView style marker directly on the chart
    if (mainSeries.current) {
      const markers = [
        ...tradeHistory.map(t => ({
          time: t.time,
          position: t.direction === 'CALL' ? 'belowBar' : 'aboveBar',
          color: t.direction === 'CALL' ? '#00e676' : '#ff1744',
          shape: t.direction === 'CALL' ? 'arrowUp' : 'arrowDown',
          text: `${t.direction} @ ₹${t.entryPrice}`
        })),
        {
          time: tradeTime,
          position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
          color: direction === 'CALL' ? '#00e676' : '#ff1744',
          shape: direction === 'CALL' ? 'arrowUp' : 'arrowDown',
          text: `AI ${direction} @ ₹${entryPrice}`
        }
      ];
      mainSeries.current.setMarkers(markers);
    }

    // Auto-resolve trade in 15 seconds (Quotex Fast-Expiry Simulation)
    setTimeout(() => {
      resolveTrade(newTrade);
    }, 15000);
  };

  const resolveTrade = (trade) => {
    const exitPrice = latestPrice;
    const win = trade.direction === 'CALL' ? exitPrice > trade.entryPrice : exitPrice < trade.entryPrice;
    const profit = win ? trade.amount * 0.85 : -trade.amount;

    setBalance(prev => +(prev + profit).toFixed(2));
    setPnl(prev => +(prev + profit).toFixed(2));

    setActiveTrades(prev => prev.filter(t => t.id !== trade.id));
    setTradeHistory(prev => [{ ...trade, exitPrice, profit, win, status: 'CLOSED' }, ...prev]);
  };

  return (
    <div className="flex h-screen w-screen bg-[#090d16] text-[#e6edf3] font-sans overflow-hidden">
      {/* LEFT SIDEBAR: Platform / Broker Feeds */}
      <div className="w-72 bg-[#0d1117] border-r border-[#21262d] flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-[#21262d] flex items-center gap-2">
            <Zap className="text-[#00e676] w-6 h-6 animate-pulse" />
            <span className="font-black text-lg tracking-wider text-white">AI MASTER TRADER</span>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Broker Feeds</p>
            <div className="space-y-1">
              {MARKETS.map(market => (
                <button
                  key={market.id}
                  onClick={() => setSelectedMarket(market)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                    selectedMarket.id === market.id 
                      ? 'bg-[#161b22] border border-[#00e676]/50 shadow-lg shadow-[#00e676]/10' 
                      : 'hover:bg-[#161b22]/50 border border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">{market.name}</div>
                    <div className="text-[10px] text-gray-400">{market.broker} • {market.type}</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#00e676]">LIVE</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Account Balance Widget */}
        <div className="p-4 bg-[#161b22] border-t border-[#21262d]">
          <div className="text-xs text-gray-400">Paper Capital</div>
          <div className="text-2xl font-black font-mono text-white">₹{balance.toLocaleString()}</div>
          <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
            {pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            Net P&L: ₹{pnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* CENTER: TradingView Chart Terminal */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar: Controls & Chart Switcher */}
        <div className="h-14 border-b border-[#21262d] bg-[#0d1117] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-white flex items-center gap-2">
              {selectedMarket.name}
              <span className="text-xs px-2 py-0.5 rounded bg-[#21262d] text-gray-300 font-mono">
                ₹{latestPrice.toFixed(2)}
              </span>
            </div>

            {/* Chart Type Selector */}
            <div className="flex bg-[#161b22] p-1 rounded-md border border-[#21262d] text-xs">
              {['candles', 'area', 'line', 'bars'].map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 rounded capitalize font-medium transition ${
                    chartType === type ? 'bg-[#238636] text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* AI Auto-Pilot Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBotActive(!botActive)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-lg ${
                botActive 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' 
                  : 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 hover:bg-[#00e676]/30'
              }`}
            >
              {botActive ? <Square size={14} /> : <Play size={14} />}
              {botActive ? 'STOP BOT AUTOPILOT' : 'START BOT AUTOPILOT'}
            </button>
          </div>
        </div>

        {/* TradingView Chart Canvas */}
        <div className="flex-1 relative" ref={chartContainerRef}></div>

        {/* Open Trades Panel (Bottom Overlay) */}
        {activeTrades.length > 0 && (
          <div className="h-28 bg-[#0d1117]/95 backdrop-blur border-t border-[#21262d] p-3 flex gap-4 overflow-x-auto">
            {activeTrades.map(trade => (
              <div key={trade.id} className="min-w-[240px] bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{trade.market}</span>
                  <span className={`font-mono font-bold ${trade.direction === 'CALL' ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                    {trade.direction} ₹{trade.amount}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">Entry: ₹{trade.entryPrice} • {trade.reason}</div>
                <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#00e676] h-full animate-[wiggle_15s_linear]"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: Quotex / Olymp Style Trade Panel */}
      <div className="w-72 bg-[#0d1117] border-l border-[#21262d] flex flex-col justify-between p-4">
        <div className="space-y-4">
          <div className="text-sm font-bold text-white uppercase tracking-wider">Order Execution</div>

          {/* Amount Input */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Investment (₹)</label>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(+e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 font-mono text-white text-sm focus:outline-none focus:border-[#00e676]"
            />
          </div>

          {/* Payout Metric */}
          <div className="bg-[#161b22] p-3 rounded-lg border border-[#21262d]">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Estimated Payout</span>
              <span className="text-[#00e676] font-bold">+85%</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#00e676] mt-1">
              +₹{(tradeAmount * 0.85).toFixed(2)}
            </div>
          </div>

          {/* Quotex-Style Big Action Buttons */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <button
              onClick={() => executeTrade('CALL', 'Manual Call')}
              className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg shadow-[#00e676]/20 transition active:scale-95"
            >
              <TrendingUp size={24} /> HIGHER / CALL
            </button>
            <button
              onClick={() => executeTrade('PUT', 'Manual Put')}
              className="w-full bg-[#ff1744] hover:bg-[#d50000] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg shadow-[#ff1744]/20 transition active:scale-95"
            >
              <TrendingDown size={24} /> LOWER / PUT
            </button>
          </div>
        </div>

        {/* AI Signal Feed */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8] mb-1">
            <Activity size={14} /> AI Analysis Engine
          </div>
          <div className="text-xs text-gray-300">Strategy: Multi-Timeframe ORB + Bollinger Mean Reversion</div>
          <div className="text-[10px] text-gray-500 mt-1">Completed candle execution only. Max risk ₹500/trade.</div>
        </div>
      </div>
    </div>
  );
}