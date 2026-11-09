import React, { useState, useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode 
} from 'lightweight-charts';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Zap, 
  Clock, 
  BarChart2, 
  Sliders, 
  Layers, 
  Minus, 
  ChevronDown, 
  Search, 
  Globe, 
  ShieldCheck, 
  Bot, 
  DollarSign, 
  HelpCircle, 
  Briefcase, 
  Wallet,
  Compass
} from 'lucide-react';

const ALL_MARKETS = [
  // India (NSE / Groww)
  { id: 'NIFTY50', name: 'NIFTY 50', country: 'India', category: 'Indices', payout: 82, base: 22450.0, step: 2.5, currency: '₹' },
  { id: 'BANKNIFTY', name: 'BANK NIFTY', country: 'India', category: 'Indices', payout: 82, base: 47920.0, step: 5.0, currency: '₹' },
  { id: 'RELIANCE', name: 'Reliance Ind.', country: 'India', category: 'Stocks', payout: 80, base: 2855.40, step: 0.5, currency: '₹' },
  { id: 'TCS', name: 'TCS Ltd.', country: 'India', category: 'Stocks', payout: 80, base: 3892.15, step: 0.8, currency: '₹' },
  { id: 'HDFCBANK', name: 'HDFC Bank', country: 'India', category: 'Stocks', payout: 80, base: 1530.10, step: 0.3, currency: '₹' },

  // Forex & OTC (Olymp Trade & Quotex Style)
  { id: 'EURUSD_OTC', name: 'EUR/USD (OTC)', country: 'Global', category: 'OTC Forex', payout: 92, base: 1.08642, step: 0.00012, currency: '$' },
  { id: 'GBPUSD_OTC', name: 'GBP/USD (OTC)', country: 'Global', category: 'OTC Forex', payout: 89, base: 1.27315, step: 0.00015, currency: '$' },
  { id: 'USDJPY', name: 'USD/JPY', country: 'Japan/US', category: 'Forex', payout: 85, base: 154.62, step: 0.02, currency: '¥' },
  { id: 'USDINR', name: 'USD/INR', country: 'India/US', category: 'Forex', payout: 84, base: 83.45, step: 0.01, currency: '₹' },

  // US Stocks
  { id: 'NVDA', name: 'NVIDIA Corp', country: 'USA', category: 'US Stocks', payout: 87, base: 885.30, step: 0.9, currency: '$' },
  { id: 'AAPL', name: 'Apple Inc.', country: 'USA', category: 'US Stocks', payout: 85, base: 182.40, step: 0.3, currency: '$' },
  { id: 'TSLA', name: 'Tesla Inc.', country: 'USA', category: 'US Stocks', payout: 88, base: 175.80, step: 0.6, currency: '$' },

  // Crypto
  { id: 'BTCUSDT', name: 'Bitcoin (BTC)', country: 'Crypto', category: 'Crypto', payout: 90, base: 88450.0, step: 15.0, currency: '$' },
  { id: 'ETHUSDT', name: 'Ethereum (ETH)', country: 'Crypto', category: 'Crypto', payout: 88, base: 3340.50, step: 1.2, currency: '$' },
  { id: 'SOLUSDT', name: 'Solana (SOL)', country: 'Crypto', category: 'Crypto', payout: 85, base: 174.20, step: 0.4, currency: '$' },

  // Commodities
  { id: 'XAUUSD', name: 'Gold (XAU/USD)', country: 'Commodities', category: 'Metals', payout: 86, base: 2335.80, step: 0.4, currency: '$' },
  { id: 'BRENT', name: 'Brent Crude Oil', country: 'Commodities', category: 'Energy', payout: 82, base: 89.40, step: 0.08, currency: '$' },
];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState(ALL_MARKETS[5]); // Default EUR/USD (OTC)
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [chartType, setChartType] = useState('candles'); // 'candles' | 'area' | 'line' | 'bars'
  const [timeframe, setTimeframe] = useState('5s');
  const [balance, setBalance] = useState(100000.0);
  const [amount, setAmount] = useState(70);
  const [durationSec, setDurationSec] = useState(5);
  const [botActive, setBotActive] = useState(true);
  
  const [latestPrice, setLatestPrice] = useState(selectedAsset.base);
  const [countdown, setCountdown] = useState(5);
  const [activeTrades, setActiveTrades] = useState([]);
  const [recentSocialTrades, setRecentSocialTrades] = useState([]);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const mainSeries = useRef(null);
  const candlesRef = useRef([]);

  // Generate Initial Historical Candle Data
  const generateHistory = (basePrice, step) => {
    let list = [];
    let p = basePrice;
    let t = Math.floor(Date.now() / 1000) - 240;
    for (let i = 0; i < 60; i++) {
      let open = p;
      let change = (Math.random() - 0.495) * (step * 2);
      let close = +(open + change).toFixed(4);
      let high = +(Math.max(open, close) + Math.random() * step).toFixed(4);
      let low = +(Math.min(open, close) - Math.random() * step).toFixed(4);
      list.push({ time: t + i * 4, open, high, low, close });
      p = close;
    }
    return list;
  };

  // 1. Initialize Chart matching Olymp Trade Dark Palette
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131518' },
        textColor: '#768292',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#00e676', width: 1, style: 3 },
        horzLine: { color: '#00e676', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#1d2229',
        autoScale: true,
      },
      timeScale: {
        borderColor: '#1d2229',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    let series;
    if (chartType === 'candles') {
      series = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
    } else if (chartType === 'area') {
      series = chart.addAreaSeries({
        topColor: 'rgba(38, 166, 154, 0.35)',
        bottomColor: 'rgba(38, 166, 154, 0.0)',
        lineColor: '#26a69a',
        lineWidth: 2,
      });
    } else if (chartType === 'bars') {
      series = chart.addBarSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
      });
    } else {
      series = chart.addLineSeries({
        color: '#26a69a',
        lineWidth: 2,
      });
    }

    const initial = generateHistory(selectedAsset.base, selectedAsset.step);
    candlesRef.current = initial;

    if (chartType === 'candles' || chartType === 'bars') {
      series.setData(initial);
    } else {
      series.setData(initial.map(c => ({ time: c.time, value: c.close })));
    }

    chartInstance.current = chart;
    mainSeries.current = series;
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
  }, [selectedAsset, chartType]);

  // 2. Real-Time Candle Ticks & Countdown Clock
  useEffect(() => {
    const timer = setInterval(() => {
      if (!mainSeries.current || candlesRef.current.length === 0) return;

      const lastCandle = { ...candlesRef.current[candlesRef.current.length - 1] };
      const change = (Math.random() - 0.495) * selectedAsset.step;
      const nextPrice = +(lastCandle.close + change).toFixed(4);

      lastCandle.close = nextPrice;
      lastCandle.high = Math.max(lastCandle.high, nextPrice);
      lastCandle.low = Math.min(lastCandle.low, nextPrice);

      candlesRef.current[candlesRef.current.length - 1] = lastCandle;

      if (chartType === 'candles' || chartType === 'bars') {
        mainSeries.current.update(lastCandle);
      } else {
        mainSeries.current.update({ time: lastCandle.time, value: nextPrice });
      }

      setLatestPrice(nextPrice);

      setCountdown(prev => (prev <= 1 ? durationSec : prev - 1));

      // Automated Bot Trading Logic
      if (botActive && Math.random() > 0.88 && activeTrades.length < 2) {
        handleTrade(Math.random() > 0.5 ? 'UP' : 'DOWN', true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAsset, chartType, botActive, activeTrades, durationSec]);

  // 3. Trade Execution with Chart Markers
  const handleTrade = (direction, isAi = false) => {
    const tradeEntry = latestPrice;
    const currentTime = candlesRef.current[candlesRef.current.length - 1].time;
    
    const newTrade = {
      id: Date.now(),
      asset: selectedAsset.name,
      direction,
      amount,
      entry: tradeEntry,
      payout: selectedAsset.payout,
      time: currentTime,
      isAi
    };

    setActiveTrades(prev => [...prev, newTrade]);

    // Add marker on chart
    if (mainSeries.current) {
      const marker = {
        time: currentTime,
        position: direction === 'UP' ? 'belowBar' : 'aboveBar',
        color: direction === 'UP' ? '#00e676' : '#ff3366',
        shape: direction === 'UP' ? 'arrowUp' : 'arrowDown',
        text: `${isAi ? 'AI' : ''} ${direction} ${selectedAsset.currency}${amount}`
      };
      mainSeries.current.setMarkers([marker]);
    }

    // Push into bottom social ticker
    setRecentSocialTrades(prev => [
      { id: Date.now(), user: isAi ? 'AI Quant Bot' : 'You', dir: direction, duration: `${durationSec}s` },
      ...prev.slice(0, 4)
    ]);

    // Resolve after duration
    setTimeout(() => {
      const finalPrice = latestPrice;
      const win = direction === 'UP' ? finalPrice > tradeEntry : finalPrice < tradeEntry;
      const profit = win ? (amount * (selectedAsset.payout / 100)) : -amount;

      setBalance(b => +(b + profit).toFixed(2));
      setActiveTrades(prev => prev.filter(t => t.id !== newTrade.id));
    }, durationSec * 1000);
  };

  const filteredAssets = ALL_MARKETS.filter(item => {
    const matchesCategory = marketFilter === 'ALL' || item.country === marketFilter || item.category === marketFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen bg-[#0e1013] text-[#e6edf3] font-sans overflow-hidden select-none">
      
      {/* 1. LEFT NARROW ICON DOCK (Olymp Trade Style) */}
      <div className="w-14 bg-[#131518] border-r border-[#1d2229] flex flex-col justify-between items-center py-4 z-20">
        <div className="flex flex-col items-center gap-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-lg shadow-[#00e676]/20 font-black text-black text-lg">
            ▲
          </div>
          <button className="text-gray-400 hover:text-white flex flex-col items-center gap-1 text-[10px]">
            <Compass size={18} />
            Explore
          </button>
          <button className="text-[#00e676] flex flex-col items-center gap-1 text-[10px]">
            <Briefcase size={18} />
            Trades
          </button>
          <button className="text-gray-400 hover:text-white flex flex-col items-center gap-1 text-[10px]">
            <BarChart2 size={18} />
            Market
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-[10px] text-gray-500 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00e676] mr-1 animate-pulse"></span>
            7,412
          </div>
          <button className="text-gray-400 hover:text-white">
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* 2. MAIN CENTER TERMINAL */}
      <div className="flex-1 flex flex-col relative">
        
        {/* TOP BAR: Asset Pill, Modes, Balance, Profile */}
        <div className="h-14 bg-[#131518] border-b border-[#1d2229] px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mode Selector Tabs */}
            <div className="flex bg-[#1a1e24] p-1 rounded-lg text-xs font-semibold">
              <button className="px-3 py-1 rounded bg-[#2a313d] text-white">Fixed Time</button>
              <button className="px-3 py-1 rounded text-gray-400 hover:text-white">Forex</button>
              <button className="px-3 py-1 rounded text-gray-400 hover:text-white">Stocks</button>
            </div>

            {/* Asset Selector Pill */}
            <button 
              onClick={() => setIsAssetModalOpen(true)}
              className="flex items-center gap-2.5 bg-[#1a1e24] hover:bg-[#252b35] border border-[#2e3744] px-3.5 py-1.5 rounded-xl transition"
            >
              <span className="text-xs font-black px-1.5 py-0.5 rounded bg-[#ff9800]/20 text-[#ff9800]">
                {selectedAsset.category}
              </span>
              <span className="font-bold text-sm text-white">{selectedAsset.name}</span>
              <span className="text-xs font-mono font-black text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded-full">
                {selectedAsset.payout}%
              </span>
              <Plus size={16} className="text-gray-400 ml-1" />
            </button>
          </div>

          {/* Account Balance & AI Mode */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1a1e24] border border-[#2a313d] px-3 py-1.5 rounded-xl">
              <Bot size={16} className={botActive ? "text-[#00e676] animate-pulse" : "text-gray-400"} />
              <span className="text-xs font-bold text-gray-300">AI Autopilot</span>
              <button 
                onClick={() => setBotActive(!botActive)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${botActive ? 'bg-[#00e676]' : 'bg-gray-600'}`}
              >
                <div className={`w-3 h-3 bg-black rounded-full transition-transform ${botActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                <span>INR Demo Account</span>
                <ChevronDown size={12} />
              </div>
              <div className="text-base font-black font-mono text-white">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <button className="bg-[#00e676] hover:bg-[#00c853] text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-[#00e676]/20 transition">
              <Wallet size={14} /> Payments
            </button>
          </div>
        </div>

        {/* CHART VIEWPORT */}
        <div className="flex-1 relative" ref={chartContainerRef}>
          
          {/* Floating Chart Controls (Bottom Left of Chart Canvas) */}
          <div className="absolute left-6 bottom-10 z-10 flex flex-col gap-2">
            {/* Timeframe Pill */}
            <div className="bg-[#1a1e24]/90 backdrop-blur border border-[#2a313d] rounded-xl p-1 flex gap-1 text-xs">
              {['5s', '15s', '1m', '5m'].map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setDurationSec(tf === '5s' ? 5 : tf === '15s' ? 15 : tf === '1m' ? 60 : 300);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    timeframe === tf ? 'bg-[#2a313d] text-[#00e676]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart Style Switcher */}
            <div className="bg-[#1a1e24]/90 backdrop-blur border border-[#2a313d] rounded-xl p-1 flex gap-1 text-xs">
              {['candles', 'area', 'line', 'bars'].map(st => (
                <button
                  key={st}
                  onClick={() => setChartType(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-bold transition ${
                    chartType === st ? 'bg-[#00e676] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Dotted Trade Expiration & Live Current Price Banner */}
          <div className="absolute right-40 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            <div className="border-r border-dashed border-gray-400/40 h-80 flex flex-col justify-between text-[10px] text-gray-500 pr-1">
              <span>Trade start</span>
              <span>Trade end</span>
            </div>
            <div className="bg-[#1a1e24] border border-[#2a313d] text-white px-2.5 py-1 rounded-md text-xs font-mono font-black ml-2 shadow-xl flex items-center gap-2">
              <span className="text-[#ff9800]">00:0{countdown}</span>
              <span>{latestPrice.toFixed(selectedAsset.step < 0.01 ? 4 : 2)}</span>
            </div>
          </div>

          {/* Bottom Live Community Ticker */}
          <div className="absolute bottom-3 left-72 flex items-center gap-3 z-10 pointer-events-none">
            {recentSocialTrades.map(st => (
              <div key={st.id} className="bg-[#131518]/90 backdrop-blur border border-[#2a313d] rounded-full px-3 py-1 flex items-center gap-2 text-[11px] animate-fade-in shadow-lg">
                <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white">👤</span>
                <span className="font-semibold text-gray-300">{st.user}</span>
                <span className={`font-black flex items-center ${st.dir === 'UP' ? 'text-[#00e676]' : 'text-[#ff3366]'}`}>
                  {st.duration} {st.dir === 'UP' ? 'Up ↑' : 'Down ↓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RIGHT ORDER EXECUTION PANEL (Olymp Trade / Quotex Style) */}
      <div className="w-80 bg-[#131518] border-l border-[#1d2229] p-5 flex flex-col justify-between z-20">
        <div className="space-y-4">
          
          {/* Amount Box */}
          <div className="bg-[#1a1e24] border border-[#2a313d] rounded-2xl p-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1">Amount, INR</div>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setAmount(prev => Math.max(70, prev - 50))}
                className="w-8 h-8 rounded-lg bg-[#252b35] hover:bg-[#2e3744] flex items-center justify-center text-white text-lg transition"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="bg-transparent text-center font-mono font-black text-xl text-white focus:outline-none w-28"
              />
              <button 
                onClick={() => setAmount(prev => prev + 50)}
                className="w-8 h-8 rounded-lg bg-[#252b35] hover:bg-[#2e3744] flex items-center justify-center text-white text-lg transition"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Duration Box */}
          <div className="bg-[#1a1e24] border border-[#2a313d] rounded-2xl p-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1">Duration</div>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setDurationSec(prev => Math.max(5, prev - 5))}
                className="w-8 h-8 rounded-lg bg-[#252b35] hover:bg-[#2e3744] flex items-center justify-center text-white text-lg transition"
              >
                <Minus size={14} />
              </button>
              <span className="font-mono font-black text-xl text-white">{durationSec}s</span>
              <button 
                onClick={() => setDurationSec(prev => prev + 5)}
                className="w-8 h-8 rounded-lg bg-[#252b35] hover:bg-[#2e3744] flex items-center justify-center text-white text-lg transition"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Big Green UP Button */}
          <button
            onClick={() => handleTrade('UP')}
            className="w-full bg-[#00e676] hover:bg-[#00c853] active:scale-98 transition py-4 rounded-2xl text-black font-black text-xl flex items-center justify-between px-6 shadow-lg shadow-[#00e676]/20"
          >
            <span>Up</span>
            <TrendingUp size={28} />
          </button>

          {/* Big Red DOWN Button */}
          <button
            onClick={() => handleTrade('DOWN')}
            className="w-full bg-[#ff3366] hover:bg-[#e62e5c] active:scale-98 transition py-4 rounded-2xl text-white font-black text-xl flex items-center justify-between px-6 shadow-lg shadow-[#ff3366]/20"
          >
            <span>Down</span>
            <TrendingDown size={28} />
          </button>

          {/* Potential Profit Calculation */}
          <div className="text-center pt-2">
            <span className="text-xs text-gray-400">Potential profit: </span>
            <span className="text-sm font-mono font-bold text-[#00e676]">
              +₹{(amount * (1 + selectedAsset.payout / 100)).toFixed(2)} ({selectedAsset.payout}%)
            </span>
          </div>
        </div>

        {/* AI Quant Trade Telemetry */}
        <div className="bg-[#1a1e24] border border-[#2a313d] rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Zap size={14} className="text-[#00e676]" /> AI Engine Signals
            </span>
            <span className="text-[10px] bg-[#00e676]/20 text-[#00e676] px-2 py-0.5 rounded font-mono font-bold">
              ACTIVE
            </span>
          </div>
          <div className="text-[11px] text-gray-400 leading-snug">
            Watching {selectedAsset.name} for 5s momentum breakouts & Bollinger reversion.
          </div>
        </div>
      </div>

      {/* 4. WORLDWIDE ASSET SELECTOR MODAL (India, US, Forex, Crypto, Commodities) */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#131518] border border-[#2a313d] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header & Search */}
            <div className="p-5 border-b border-[#2a313d]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <Globe size={20} className="text-[#00e676]" /> All World Markets
                </div>
                <button 
                  onClick={() => setIsAssetModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#1a1e24] hover:bg-[#252b35] text-gray-300 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Country & Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 text-xs font-semibold scrollbar-none">
                {['ALL', 'India', 'USA', 'Global', 'Crypto', 'Commodities'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMarketFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                      marketFilter === cat ? 'bg-[#00e676] text-black font-black' : 'bg-[#1a1e24] text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative mt-3">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search assets (e.g. NIFTY, EUR/USD, NVDA, BTC)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a1e24] border border-[#2a313d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e676]"
                />
              </div>
            </div>

            {/* Asset List Grid */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setLatestPrice(asset.base);
                    setIsAssetModalOpen(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a1e24]/70 hover:bg-[#1a1e24] border border-[#252b35] hover:border-[#00e676]/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#252b35] flex items-center justify-center font-black text-sm text-white">
                      {asset.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{asset.name}</div>
                      <div className="text-[11px] text-gray-400">{asset.country} • {asset.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-gray-300">
                      {asset.currency}{asset.base.toLocaleString()}
                    </span>
                    <span className="font-mono font-black text-sm text-[#00e676] bg-[#00e676]/10 px-2.5 py-1 rounded-lg">
                      {asset.payout}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}