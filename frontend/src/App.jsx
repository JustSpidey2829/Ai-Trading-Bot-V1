import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  ChevronDown, 
  Search, 
  Globe, 
  Bot, 
  HelpCircle, 
  Briefcase, 
  Wallet, 
  Compass, 
  Activity, 
  Check, 
  X, 
  Radio, 
  Sliders, 
  Sparkles, 
  ShoppingBag, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  BookOpen,
  DollarSign
} from 'lucide-react';

const ALL_MARKETS = [
  // 1. Olymp Trade Synthetic & OTC
  { id: 'AI_GLOBAL', name: 'AI Global Index', country: 'Global', category: 'InZone', payout: 110, base: 6696.6772, step: 0.12, currency: 'Ð' },
  { id: 'EURUSD_OTC', name: 'EUR/USD (OTC)', country: 'Global', category: 'OTC Forex', payout: 92, base: 1.08642, step: 0.00018, currency: '$' },
  { id: 'GBPUSD_OTC', name: 'GBP/USD (OTC)', country: 'Global', category: 'OTC Forex', payout: 89, base: 1.27315, step: 0.00022, currency: '$' },
  { id: 'USDJPY', name: 'USD/JPY', country: 'Global', category: 'Forex', payout: 85, base: 154.62, step: 0.04, currency: '¥' },
  
  // 2. Indian Indices & Equities (Groww, Zerodha Kite, Upstox)
  { id: 'NIFTY50', name: 'NIFTY 50', country: 'India', category: 'Indices', payout: 85, base: 22450.40, step: 4.5, currency: '₹' },
  { id: 'BANKNIFTY', name: 'BANK NIFTY', country: 'India', category: 'Indices', payout: 85, base: 47925.80, step: 9.0, currency: '₹' },
  { id: 'FINNIFTY', name: 'NIFTY FIN SERVICE', country: 'India', category: 'Indices', payout: 82, base: 21320.10, step: 3.5, currency: '₹' },
  { id: 'RELIANCE', name: 'Reliance Industries', country: 'India', category: 'Stocks', payout: 80, base: 2855.40, step: 0.9, currency: '₹' },
  { id: 'TCS', name: 'Tata Consultancy Services', country: 'India', category: 'Stocks', payout: 80, base: 3892.15, step: 1.2, currency: '₹' },
  { id: 'HDFCBANK', name: 'HDFC Bank Ltd', country: 'India', category: 'Stocks', payout: 80, base: 1532.60, step: 0.6, currency: '₹' },

  // 3. US Equities, Crypto & Commodities
  { id: 'NVDA', name: 'NVIDIA Corp', country: 'USA', category: 'Stocks', payout: 87, base: 885.30, step: 1.5, currency: '$' },
  { id: 'BTCUSDT', name: 'Bitcoin (BTC)', country: 'Crypto', category: 'Crypto', payout: 90, base: 88450.0, step: 24.0, currency: '$' },
  { id: 'XAUUSD', name: 'Gold (XAU/USD)', country: 'Commodities', category: 'Metals', payout: 86, base: 2335.80, step: 0.8, currency: '$' }
];

const TIMEFRAMES = [
  { label: '5s', sec: 5, candleCount: 40 },
  { label: '15s', sec: 15, candleCount: 40 },
  { label: '1m', sec: 60, candleCount: 45 },
  { label: '5m', sec: 300, candleCount: 45 },
  { label: '15m', sec: 900, candleCount: 45 },
  { label: '1H', sec: 3600, candleCount: 50 },
  { label: '1D', sec: 86400, candleCount: 55 },
  { label: '1W', sec: 604800, candleCount: 60 },
  { label: '1M', sec: 2592000, candleCount: 65 },
  { label: '1Y', sec: 31536000, candleCount: 70 },
  { label: '5Y', sec: 157680000, candleCount: 75 }
];

const AVAILABLE_INDICATORS = [
  { id: 'alligator', name: 'Alligator' },
  { id: 'bollinger', name: 'Bollinger Bands' },
  { id: 'donchian', name: 'Donchian Channel' },
  { id: 'ema', name: 'EMA' },
  { id: 'ichimoku', name: 'Ichimoku Cloud' },
  { id: 'keltner', name: 'Keltner Channel' },
  { id: 'parabolic', name: 'Parabolic SAR' },
  { id: 'sentiment', name: 'Sentiment' }
];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState(ALL_MARKETS[0]);
  const [activeMode, setActiveMode] = useState('Fixed Time'); // 'Fixed Time' | 'InZone' | 'Forex' | 'Stocks'
  
  // UI Interactive Popups & Active Drawers
  const [activeLeftDrawer, setActiveLeftDrawer] = useState(null); // 'indicators' | 'trades' | 'market' | 'home' | 'funded' | 'help' | null
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState('ALL');

  // Chart Controls
  const [chartType, setChartType] = useState('candles'); // 'area' | 'candles' | 'heikin' | 'bars'
  const [selectedTf, setSelectedTf] = useState(TIMEFRAMES[1]); // Default 15s
  const [balance, setBalance] = useState(10000.0);
  const [amount, setAmount] = useState(70);
  const [durationSec, setDurationSec] = useState(15);
  const [botActive, setBotActive] = useState(true);

  // Indicators State
  const [activeIndicators, setActiveIndicators] = useState({
    alligator: false,
    bollinger: true,
    donchian: false,
    ema: true,
    ichimoku: false,
    keltner: false,
    parabolic: false,
    sentiment: true
  });

  const [latestPrice, setLatestPrice] = useState(selectedAsset.base);
  const [countdown, setCountdown] = useState(15);
  const [candles, setCandles] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);

  const [aiTelemetry, setAiTelemetry] = useState({
    rsi: 52.4,
    trend: 'BULLISH',
    winRate: 89,
    lastReason: 'Dynamic Volatility Breakout & Institutional VWAP holding firm.'
  });

  const canvasRef = useRef(null);

  // 1. Initial Candles Generation
  useEffect(() => {
    let p = selectedAsset.base;
    const count = selectedTf.candleCount;
    const initialList = [];
    const multiplier = selectedTf.sec > 86400 ? (selectedTf.sec / 86400) * 0.15 : 1;

    for (let i = 0; i < count; i++) {
      const open = p;
      const drift = (Math.random() - 0.495) * (selectedAsset.step * 2.2 * multiplier);
      const close = Number((open + drift).toFixed(selectedAsset.step < 0.01 ? 4 : 2));
      const high = Number((Math.max(open, close) + Math.random() * selectedAsset.step * multiplier).toFixed(selectedAsset.step < 0.01 ? 4 : 2));
      const low = Number((Math.min(open, close) - Math.random() * selectedAsset.step * multiplier).toFixed(selectedAsset.step < 0.01 ? 4 : 2));
      initialList.push({ open, high, low, close });
      p = close;
    }
    setCandles(initialList);
    setLatestPrice(p);
  }, [selectedAsset, selectedTf]);

  // 2. Real-Time Price Engine & AI Automation Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCandles(prev => {
        if (!prev || prev.length === 0) return prev;
        const list = [...prev];
        const last = { ...list[list.length - 1] };
        const change = (Math.random() - 0.495) * selectedAsset.step;
        const newClose = Number((last.close + change).toFixed(selectedAsset.step < 0.01 ? 4 : 2));

        last.close = newClose;
        last.high = Math.max(last.high, newClose);
        last.low = Math.min(last.low, newClose);
        list[list.length - 1] = last;

        setLatestPrice(newClose);

        // Calculate RSI(14) Proxy & Real AI Opportunity Execution
        if (list.length >= 14) {
          let gains = 0, losses = 0;
          for (let i = list.length - 14; i < list.length; i++) {
            const diff = list[i].close - list[i].open;
            if (diff >= 0) gains += diff;
            else losses += Math.abs(diff);
          }
          const rs = losses === 0 ? 100 : gains / losses;
          const currentRsi = Number((100 - (100 / (1 + rs))).toFixed(1));

          if (botActive && activeTrades.length < 2) {
            if (currentRsi < 34 && Math.random() > 0.45) {
              setAiTelemetry({
                rsi: currentRsi,
                trend: 'OVERSOLD REVERSAL',
                winRate: 91,
                lastReason: `RSI Oversold (${currentRsi}) + Lower Support Wick Rejection`
              });
              executeOrder('CALL', true, 'AI Oversold Reversal');
            } else if (currentRsi > 66 && Math.random() > 0.45) {
              setAiTelemetry({
                rsi: currentRsi,
                trend: 'OVERBOUGHT EXHAUSTION',
                winRate: 88,
                lastReason: `RSI Overbought (${currentRsi}) + Upper Resistance Breakdown`
              });
              executeOrder('PUT', true, 'AI Overbought Exhaustion');
            }
          }
        }

        return list;
      });

      // Update Active Order Timers
      setActiveTrades(prev => prev.map(tr => ({
        ...tr,
        remaining: Math.max(0, tr.remaining - 1)
      })));

      setCountdown(prev => (prev <= 1 ? durationSec : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAsset, botActive, activeTrades.length, durationSec, latestPrice]);

  // Order Expiry Manager
  useEffect(() => {
    const expired = activeTrades.filter(t => t.remaining <= 0);
    if (expired.length > 0) {
      expired.forEach(trade => {
        const isUp = trade.direction === 'UP' || trade.direction === 'CALL' || trade.direction === 'BUY';
        const win = isUp ? latestPrice > trade.entry : latestPrice < trade.entry;
        const profit = win ? Number((trade.amount * (trade.payout / 100)).toFixed(2)) : -trade.amount;
        
        setBalance(b => Number((b + profit).toFixed(2)));
        setClosedTrades(c => [{
          ...trade,
          exit: latestPrice,
          profit,
          win,
          closedAt: new Date().toLocaleTimeString()
        }, ...c.slice(0, 19)]);
      });
      setActiveTrades(prev => prev.filter(t => t.remaining > 0));
    }
  }, [activeTrades, latestPrice]);

  // 3. Pixel-Perfect Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0 || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 800;
    const height = canvas.parentElement.clientHeight || 500;

    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 60; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    let minP = Infinity;
    let maxP = -Infinity;
    candles.forEach(c => {
      minP = Math.min(minP, c.low);
      maxP = Math.max(maxP, c.high);
    });
    const padding = (maxP - minP) * 0.3 || 0.001;
    minP -= padding;
    maxP += padding;

    const chartHeight = height - 40;
    const getY = (price) => chartHeight - ((price - minP) / (maxP - minP)) * chartHeight + 20;
    const candleWidth = Math.max(7, (width - 240) / candles.length - 5);

    // Bollinger Bands Indicator
    if (activeIndicators.bollinger && candles.length >= 15) {
      const upperBand = [];
      const lowerBand = [];
      for (let i = 14; i < candles.length; i++) {
        const slice = candles.slice(i - 14, i + 1);
        const mean = slice.reduce((acc, c) => acc + c.close, 0) / 15;
        const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / 15;
        const stdDev = Math.sqrt(variance);
        const x = i * (candleWidth + 5) + 20 + candleWidth / 2;
        upperBand.push({ x, y: getY(mean + stdDev * 2) });
        lowerBand.push({ x, y: getY(mean - stdDev * 2) });
      }

      if (upperBand.length > 1) {
        ctx.beginPath();
        ctx.moveTo(upperBand[0].x, upperBand[0].y);
        upperBand.forEach(p => ctx.lineTo(p.x, p.y));
        for (let j = lowerBand.length - 1; j >= 0; j--) {
          ctx.lineTo(lowerBand[j].x, lowerBand[j].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.03)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // EMA Indicator
    if (activeIndicators.ema && candles.length > 5) {
      ctx.beginPath();
      const k = 2 / (20 + 1);
      let ema = candles[0].close;
      candles.forEach((c, i) => {
        ema = c.close * k + ema * (1 - k);
        const x = i * (candleWidth + 5) + 20 + candleWidth / 2;
        const y = getY(ema);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#00b0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Chart Style Rendering
    if (chartType === 'area') {
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = i * (candleWidth + 5) + 20 + candleWidth / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      const lastX = (candles.length - 1) * (candleWidth + 5) + 20 + candleWidth / 2;
      const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
      gradient.addColorStop(0, 'rgba(0, 230, 118, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');
      ctx.lineTo(lastX, chartHeight + 20);
      ctx.lineTo(20, chartHeight + 20);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (chartType === 'bars') {
      candles.forEach((c, i) => {
        const x = i * (candleWidth + 5) + 20;
        const isUp = c.close >= c.open;
        ctx.strokeStyle = isUp ? '#00e676' : '#ff4d6d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, getY(c.high));
        ctx.lineTo(x + candleWidth / 2, getY(c.low));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, getY(c.open));
        ctx.lineTo(x + candleWidth / 2, getY(c.open));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, getY(c.close));
        ctx.lineTo(x + candleWidth, getY(c.close));
        ctx.stroke();
      });
    } else {
      candles.forEach((c, i) => {
        const x = i * (candleWidth + 5) + 20;
        let openVal = c.open;
        let closeVal = c.close;
        
        if (chartType === 'heikin' && i > 0) {
          const prev = candles[i - 1];
          openVal = (prev.open + prev.close) / 2;
          closeVal = (c.open + c.high + c.low + c.close) / 4;
        }

        const isUp = closeVal >= openVal;
        const color = isUp ? '#26a69a' : '#ef5350';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, getY(c.high));
        ctx.lineTo(x + candleWidth / 2, getY(c.low));
        ctx.stroke();

        const topY = getY(Math.max(openVal, closeVal));
        const bottomY = getY(Math.min(openVal, closeVal));
        const bodyH = Math.max(3, bottomY - topY);

        ctx.fillStyle = color;
        ctx.fillRect(x, topY, candleWidth, bodyH);
      });
    }

    // InZone Target Corridor Box (When in InZone Mode)
    const inZoneY = getY(latestPrice);
    const boxWidth = 160;
    const boxStart = width - boxWidth - 30;

    if (activeMode === 'InZone') {
      ctx.fillStyle = 'rgba(30, 58, 138, 0.2)';
      ctx.fillRect(boxStart, inZoneY - 34, boxWidth, 68);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(boxStart, inZoneY - 34);
      ctx.lineTo(boxStart + boxWidth, inZoneY - 34);
      ctx.moveTo(boxStart, inZoneY + 34);
      ctx.lineTo(boxStart + boxWidth, inZoneY + 34);
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('+0.003%', boxStart + boxWidth - 45, inZoneY - 38);
      ctx.fillText('-0.003%', boxStart + boxWidth - 45, inZoneY + 46);
    }

    // Dotted Vertical Line for "Trade start"
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(boxStart, 20);
    ctx.lineTo(boxStart, chartHeight + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText('Trade', boxStart - 32, 45);
    ctx.fillText('start', boxStart - 30, 56);

    // Flag Pin Icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(boxStart, 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('⚑', boxStart - 3, 29);

    // Live White Price Tag on Right Scale
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width - 72, inZoneY - 10, 72, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(latestPrice.toFixed(selectedAsset.step < 0.01 ? 4 : 2), width - 68, inZoneY + 4);

    // Active Countdown Pill
    ctx.fillStyle = '#1e242d';
    ctx.fillRect(boxStart + 16, inZoneY - 10, 44, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('00:0' + (countdown < 10 ? '0' : '') + countdown, boxStart + 20, inZoneY + 4);

    // Active Trade Markers & Horizontal Strike Lines
    activeTrades.forEach(tr => {
      const trY = getY(tr.entry);
      const isUp = tr.direction === 'UP' || tr.direction === 'CALL' || tr.direction === 'BUY';
      
      ctx.fillStyle = isUp ? '#00e676' : '#ff4d6d';
      ctx.beginPath();
      ctx.arc(boxStart, trY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal Strike Line
      ctx.strokeStyle = isUp ? 'rgba(0, 230, 118, 0.6)' : 'rgba(255, 77, 109, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boxStart - 120, trY);
      ctx.lineTo(width - 75, trY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText((tr.isAi ? 'AI ' : '') + tr.direction + ' ' + selectedAsset.currency + tr.amount, boxStart - 90, trY - 5);
    });

  }, [candles, latestPrice, chartType, activeTrades, activeIndicators, countdown, activeMode]);

  const executeOrder = (direction, isAi = false, reason = 'Manual Order') => {
    const entry = latestPrice;
    const newTrade = {
      id: Date.now(),
      market: selectedAsset.name,
      currency: selectedAsset.currency,
      direction,
      amount,
      entry,
      payout: selectedAsset.payout,
      remaining: durationSec,
      totalDuration: durationSec,
      isAi,
      reason
    };

    setActiveTrades(prev => [newTrade, ...prev]);
  };

  const filteredIndicators = AVAILABLE_INDICATORS.filter(ind => 
    ind.name.toLowerCase().includes(indicatorSearch.toLowerCase())
  );

  const filteredAssets = ALL_MARKETS.filter(item => {
    const matchesCategory = marketFilter === 'ALL' || item.country === marketFilter || item.category === marketFilter;
    return matchesCategory;
  });

  return (
    <div className="flex h-screen w-screen bg-[#0e0f12] text-[#e6edf3] font-sans overflow-hidden select-none">
      
      {/* 1. LEFT STATIC NAVIGATION DOCK (Every Tab Has an Assigned Drawer/Action) */}
      <div className="w-14 bg-[#121316] border-r border-[#1e2025] flex flex-col justify-between items-center py-3 z-30">
        <div className="flex flex-col items-center gap-5">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-white text-base">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </div>

          {/* Home */}
          <button 
            onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'home' ? null : 'home')}
            className={`flex flex-col items-center gap-1 text-[10px] transition ${activeLeftDrawer === 'home' ? 'text-[#00e676]' : 'text-gray-400 hover:text-white'}`}
          >
            <Compass size={18} />
            <span>Home</span>
          </button>
          
          {/* Funded */}
          <button 
            onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'funded' ? null : 'funded')}
            className={`flex flex-col items-center gap-1 text-[10px] transition ${activeLeftDrawer === 'funded' ? 'text-[#00e676]' : 'text-gray-400 hover:text-white'}`}
          >
            <ShieldAlert size={18} />
            <span>Funded</span>
          </button>

          {/* Trades */}
          <button 
            onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'trades' ? null : 'trades')}
            className={`flex flex-col items-center gap-1 text-[10px] relative transition ${activeLeftDrawer === 'trades' ? 'text-[#00e676]' : 'text-gray-400 hover:text-white'}`}
          >
            <Briefcase size={18} />
            <span>Trades</span>
            {activeTrades.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#00e676]"></span>
            )}
          </button>

          {/* Market */}
          <button 
            onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'market' ? null : 'market')}
            className={`flex flex-col items-center gap-1 text-[10px] transition ${activeLeftDrawer === 'market' ? 'text-[#00e676]' : 'text-gray-400 hover:text-white'}`}
          >
            <ShoppingBag size={18} />
            <span>Market</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-[10px] text-gray-500 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00e676] mr-1 animate-pulse"></span>
            6980
            <div className="text-[9px]">online</div>
          </div>
          <button 
            onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'help' ? null : 'help')}
            className={`text-gray-400 hover:text-white transition ${activeLeftDrawer === 'help' ? 'text-[#00e676]' : ''}`}
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC LEFT DRAWER SYSTEM */}
      
      {/* 2.1 Indicators Drawer */}
      {activeLeftDrawer === 'indicators' && (
        <div className="w-72 bg-[#14161a] border-r border-[#1e2025] flex flex-col z-20 animate-in slide-in-from-left duration-200">
          <div className="p-4 border-b border-[#1e2025] flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Technical Analysis</h2>
            <button 
              onClick={() => setActiveLeftDrawer(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1f2228]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a855f7] rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-purple-900/20">
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase mb-1">
                  <Sparkles size={14} className="text-yellow-300" /> AI-powered strategies
                </div>
                <p className="text-[11px] text-white/90 leading-tight">
                  An easy way to find the right moment to jump into a trade.
                </p>
                <button 
                  onClick={() => setBotActive(!botActive)}
                  className="mt-3 bg-white text-black font-black text-[11px] px-3 py-1.5 rounded-xl shadow hover:bg-gray-100 transition"
                >
                  {botActive ? 'Strategy Active ✓' : 'Enable Strategy'}
                </button>
              </div>
              <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-black/25 rounded-full blur-sm"></div>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search indicators..."
                value={indicatorSearch}
                onChange={(e) => setIndicatorSearch(e.target.value)}
                className="w-full bg-[#1b1e24] border border-[#262931] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00e676]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Compass size={14} /> Indicators
                </span>
                <ChevronDown size={14} />
              </div>

              <div className="space-y-1">
                {filteredIndicators.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => setActiveIndicators(prev => ({ ...prev, [ind.id]: !prev[ind.id] }))}
                    className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left text-xs text-gray-300 hover:text-white hover:bg-[#1b1e24] transition"
                  >
                    <span>{ind.name}</span>
                    {activeIndicators[ind.id] && (
                      <Check size={14} className="text-[#00e676] font-bold" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.2 Trades Drawer */}
      {activeLeftDrawer === 'trades' && (
        <div className="w-80 bg-[#14161a] border-r border-[#1e2025] flex flex-col z-20 animate-in slide-in-from-left duration-200">
          <div className="p-4 border-b border-[#1e2025] flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Trades Overview</h2>
            <button 
              onClick={() => setActiveLeftDrawer(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1f2228]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Executions ({activeTrades.length})</div>
            {activeTrades.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">No open positions currently running.</div>
            ) : (
              activeTrades.map(tr => (
                <div key={tr.id} className="bg-[#1b1e24] p-3 rounded-xl border border-[#262931] flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{tr.market}</span>
                    <span className={`font-mono font-black ${tr.direction.includes('UP') || tr.direction.includes('CALL') || tr.direction.includes('BUY') ? 'text-[#00e676]' : 'text-[#ff4d6d]'}`}>
                      {tr.direction}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Entry: {tr.entry}</span>
                    <span className="font-mono text-[#00e676] font-bold">{tr.remaining}s left</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className="bg-[#00e676] h-full transition-all duration-1000"
                      style={{ width: `${(tr.remaining / tr.totalDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}

            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Trade History ({closedTrades.length})</div>
            {closedTrades.map(tr => (
              <div key={tr.id} className="bg-[#1b1e24] p-3 rounded-xl border border-[#262931] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white">{tr.market}</div>
                  <div className="text-[10px] text-gray-500">{tr.closedAt}</div>
                </div>
                <div className={`font-mono font-black ${tr.profit >= 0 ? 'text-[#00e676]' : 'text-[#ff4d6d]'}`}>
                  {tr.profit >= 0 ? '+' : ''}{tr.currency || 'Ð'}{tr.profit.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2.3 Market Drawer */}
      {activeLeftDrawer === 'market' && (
        <div className="w-80 bg-[#14161a] border-r border-[#1e2025] flex flex-col z-20 animate-in slide-in-from-left duration-200">
          <div className="p-4 border-b border-[#1e2025] flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Live Assets Directory</h2>
            <button onClick={() => setActiveLeftDrawer(null)} className="text-gray-400 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {ALL_MARKETS.map(asset => (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setLatestPrice(asset.base);
                  setActiveLeftDrawer(null);
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedAsset.id === asset.id ? 'bg-[#1e232c] border-[#00e676]' : 'bg-[#1b1e24] border-[#262931] hover:border-gray-500'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white">{asset.name}</div>
                  <div className="text-[10px] text-gray-400">{asset.country} • {asset.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-white">{asset.currency}{asset.base.toLocaleString()}</div>
                  <div className="text-[10px] font-black text-[#00e676]">+{asset.payout}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2.4 Funded Drawer */}
      {activeLeftDrawer === 'funded' && (
        <div className="w-80 bg-[#14161a] border-r border-[#1e2025] flex flex-col z-20 animate-in slide-in-from-left duration-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2025] pb-3">
            <h2 className="text-base font-bold text-white">Prop / Funded Account</h2>
            <button onClick={() => setActiveLeftDrawer(null)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="bg-[#1b1e24] p-4 rounded-2xl border border-[#262931] space-y-2">
            <div className="text-xs text-gray-400">Capital Balance</div>
            <div className="text-2xl font-black font-mono text-white">{selectedAsset.currency}{balance.toLocaleString()}</div>
            <div className="text-[11px] text-[#00e676] font-bold">Status: Active Paper Sim</div>
          </div>
          <button 
            onClick={() => setBalance(10000.0)}
            className="w-full bg-[#1e232c] hover:bg-[#252b36] border border-[#2d3340] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <RotateCcw size={14} /> Reset Capital to 10,000
          </button>
        </div>
      )}

      {/* 2.5 Help Drawer */}
      {activeLeftDrawer === 'help' && (
        <div className="w-80 bg-[#14161a] border-r border-[#1e2025] flex flex-col z-20 animate-in slide-in-from-left duration-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2025] pb-3">
            <h2 className="text-base font-bold text-white">Terminal Help Guide</h2>
            <button onClick={() => setActiveLeftDrawer(null)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3 text-xs text-gray-300">
            <div>
              <span className="font-bold text-white">Fixed Time Trading:</span> Predict if quote will be higher or lower when duration finishes.
            </div>
            <div>
              <span className="font-bold text-white">InZone Trading:</span> Payout (+110%) is awarded if price stays within target corridors.
            </div>
            <div>
              <span className="font-bold text-white">AI Autopilot:</span> Executes institutional mean-reversion signals automatically.
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN TERMINAL CHART VIEWPORT */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* TOP BAR */}
        <div className="h-14 bg-[#121316] border-b border-[#1e2025] px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Pill Navigation Tabs */}
            <div className="flex bg-[#1a1c21] p-1 rounded-xl text-xs font-semibold">
              {['Fixed Time', 'InZone', 'Forex', 'Stocks'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeMode === mode ? 'bg-[#242730] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode === 'InZone' && <span className="w-2 h-2 rounded-full bg-[#00e676]"></span>}
                  {mode}
                </button>
              ))}
            </div>

            {/* Asset Selector Pill (+) */}
            <button 
              onClick={() => setIsAssetModalOpen(true)}
              className="flex items-center gap-2 bg-[#1a1c21] hover:bg-[#22252c] border border-[#262931] px-3.5 py-1.5 rounded-xl transition"
            >
              <div className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-[10px]">
                ✦
              </div>
              <span className="font-bold text-xs text-white">{selectedAsset.name}</span>
              <span className="text-xs font-mono font-black text-[#00e676]">
                {selectedAsset.payout}%
              </span>
              <Plus size={14} className="text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-black font-mono text-white">
                {selectedAsset.currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                <span>Demo account</span>
                <ChevronDown size={11} />
              </div>
            </div>

            <button className="bg-[#00e676] hover:bg-[#00c853] text-black font-black px-4 py-1.5 rounded-xl text-xs shadow-lg shadow-[#00e676]/20 transition">
              Payments
            </button>

            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center text-sm font-bold text-white border border-emerald-500/30">
                👤
              </div>
              <span className="absolute -top-1 -right-1 bg-[#00e676] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                2
              </span>
            </div>
          </div>
        </div>

        {/* FULLSCREEN CANVAS */}
        <div className="flex-1 relative w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* 4. VERTICAL TOOL DOCK (Bottom-Left - Fully Wired) */}
          <div className="absolute left-6 bottom-8 z-20 flex flex-col gap-2">
            
            {/* Timeframe Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowTimeframeMenu(!showTimeframeMenu);
                  setShowChartTypeMenu(false);
                }}
                className="w-10 h-10 rounded-xl bg-[#1b1e24] border border-[#262931] hover:border-[#00e676] text-xs font-bold text-white flex items-center justify-center shadow-lg transition"
              >
                {selectedTf.label}
              </button>

              {/* Timeframes Popover (5s to 5 Years) */}
              {showTimeframeMenu && (
                <div className="absolute left-12 bottom-0 bg-[#17191f] border border-[#262931] rounded-2xl p-2 w-48 shadow-2xl z-30 grid grid-cols-3 gap-1">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf.label}
                      onClick={() => {
                        setSelectedTf(tf);
                        setDurationSec(Math.min(tf.sec, 300));
                        setShowTimeframeMenu(false);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold text-center transition ${
                        selectedTf.label === tf.label ? 'bg-[#00e676] text-black' : 'text-gray-400 hover:text-white hover:bg-[#20232a]'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chart Type Selector Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowChartTypeMenu(!showChartTypeMenu);
                  setShowTimeframeMenu(false);
                }}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg transition ${
                  showChartTypeMenu ? 'bg-[#242730] border-[#00e676] text-[#00e676]' : 'bg-[#1b1e24] border-[#262931] text-gray-300 hover:text-white'
                }`}
              >
                <Sliders size={18} />
              </button>

              {/* Chart Types Popover */}
              {showChartTypeMenu && (
                <div className="absolute left-12 bottom-0 bg-[#17191f] border border-[#262931] rounded-2xl p-3 w-56 shadow-2xl z-30 space-y-1">
                  <div className="text-[11px] font-bold text-gray-400 px-2 py-1">Chart Type</div>
                  {[
                    { id: 'area', label: 'Area chart', icon: '📈' },
                    { id: 'candles', label: 'Japanese candlesticks', icon: '🕯️' },
                    { id: 'heikin', label: 'Heikin Ashi', icon: '📊' },
                    { id: 'bars', label: 'Bars', icon: '||' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setChartType(item.id);
                        setShowChartTypeMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-[#20232a] hover:text-white transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        {item.label}
                      </span>
                      {chartType === item.id && (
                        <Check size={14} className="text-[#00e676]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Signals Button */}
            <button 
              onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'indicators' ? null : 'indicators')}
              className="w-10 h-10 rounded-xl bg-[#1b1e24] border border-[#262931] text-gray-400 hover:text-white flex items-center justify-center shadow-lg transition"
            >
              <Radio size={16} />
            </button>

            {/* Indicators Icon (Compass / A) */}
            <button 
              onClick={() => setActiveLeftDrawer(activeLeftDrawer === 'indicators' ? null : 'indicators')}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg transition ${
                activeLeftDrawer === 'indicators' ? 'bg-[#242730] border-[#00e676] text-[#00e676]' : 'bg-[#1b1e24] border-[#262931] text-gray-300 hover:text-white'
              }`}
            >
              <Compass size={18} />
            </button>
          </div>

          {/* Bottom Zoom Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-[#1a1c21] border border-[#262931] rounded-xl p-1 z-10 shadow-lg">
            <button 
              onClick={() => setSelectedTf(prev => TIMEFRAMES[Math.max(0, TIMEFRAMES.indexOf(prev) - 1)])}
              className="px-3 py-1 text-gray-300 hover:text-white transition"
            >
              —
            </button>
            <div className="h-4 w-px bg-gray-700"></div>
            <button 
              onClick={() => setSelectedTf(prev => TIMEFRAMES[Math.min(TIMEFRAMES.length - 1, TIMEFRAMES.indexOf(prev) + 1)])}
              className="px-3 py-1 text-gray-300 hover:text-white transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 5. RIGHT ORDER EXECUTION PANEL (Clickable Call / Put, Up / Down & Buy / Sell) */}
      <div className="w-72 bg-[#121316] border-l border-[#1e2025] p-4 flex flex-col justify-between z-20">
        <div className="space-y-4">
          
          {/* Amount Box */}
          <div className="bg-[#1a1c21] border border-[#262931] rounded-2xl p-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1 text-center">Amount, {selectedAsset.currency}</div>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setAmount(prev => Math.max(10, prev - 10))}
                className="w-7 h-7 rounded-lg bg-[#242730] hover:bg-[#2d313d] flex items-center justify-center text-white transition"
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="bg-transparent text-center font-mono font-black text-lg text-white focus:outline-none w-24"
              />
              <button 
                onClick={() => setAmount(prev => prev + 10)}
                className="w-7 h-7 rounded-lg bg-[#242730] hover:bg-[#2d313d] flex items-center justify-center text-white transition"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Duration Box */}
          <div className="bg-[#1a1c21] border border-[#262931] rounded-2xl p-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1 text-center">Duration</div>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setDurationSec(prev => Math.max(5, prev - 5))}
                className="w-7 h-7 rounded-lg bg-[#242730] hover:bg-[#2d313d] flex items-center justify-center text-white transition"
              >
                <Minus size={13} />
              </button>
              <span className="font-mono font-black text-lg text-white">{durationSec} sec</span>
              <button 
                onClick={() => setDurationSec(prev => prev + 5)}
                className="w-7 h-7 rounded-lg bg-[#242730] hover:bg-[#2d313d] flex items-center justify-center text-white transition"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* ORDER EXECUTION BUTTONS (Context-Aware to Mode) */}
          {activeMode === 'InZone' ? (
            <button
              onClick={() => executeOrder('UP', false, 'Manual InZone Execution')}
              className="w-full bg-[#00e676] hover:bg-[#00c853] active:scale-98 transition py-3.5 rounded-2xl text-black font-black text-base flex items-center justify-center shadow-lg shadow-[#00e676]/20"
            >
              Open Trade
            </button>
          ) : activeMode === 'Forex' || activeMode === 'Stocks' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => executeOrder('BUY', false, 'Manual Long/Buy')}
                className="bg-[#00e676] hover:bg-[#00c853] active:scale-95 transition py-3 rounded-2xl text-black font-black text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#00e676]/20"
              >
                <TrendingUp size={16} /> BUY / LONG
              </button>
              <button
                onClick={() => executeOrder('SELL', false, 'Manual Short/Sell')}
                className="bg-[#ff4d6d] hover:bg-[#e63956] active:scale-95 transition py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#ff4d6d]/20"
              >
                <TrendingDown size={16} /> SELL / SHORT
              </button>
            </div>
          ) : (
            // Fixed Time / Call & Put Mode
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => executeOrder('CALL', false, 'Manual Call Trade')}
                className="w-full bg-[#00e676] hover:bg-[#00c853] active:scale-98 transition py-3.5 rounded-2xl text-black font-black text-lg flex items-center justify-between px-5 shadow-lg shadow-[#00e676]/20"
              >
                <span>Up / Call</span>
                <TrendingUp size={24} />
              </button>
              <button
                onClick={() => executeOrder('PUT', false, 'Manual Put Trade')}
                className="w-full bg-[#ff4d6d] hover:bg-[#e63956] active:scale-98 transition py-3.5 rounded-2xl text-white font-black text-lg flex items-center justify-between px-5 shadow-lg shadow-[#ff4d6d]/20"
              >
                <span>Down / Put</span>
                <TrendingDown size={24} />
              </button>
            </div>
          )}

          {/* Payout Calculation */}
          <div className="text-center space-y-1">
            <div className="text-xs text-gray-300">
              Potential profit: <span className="font-black text-[#00e676]">+{selectedAsset.currency}{(amount * (1 + selectedAsset.payout / 100)).toFixed(2)}</span> ({selectedAsset.payout}%)
            </div>
            <div 
              onClick={() => setActiveLeftDrawer('help')}
              className="text-[11px] text-gray-500 flex items-center justify-center gap-1 cursor-pointer hover:text-gray-400"
            >
              How it works <HelpCircle size={12} />
            </div>
          </div>
        </div>

        {/* AI Autopilot Switch & Telemetry */}
        <div className="bg-[#1a1c21] border border-[#262931] rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Bot size={14} className={botActive ? "text-[#00e676] animate-pulse" : "text-gray-400"} /> AI Autopilot
            </span>
            <button 
              onClick={() => setBotActive(!botActive)}
              className={`w-7 h-3.5 rounded-full p-0.5 transition-colors ${botActive ? 'bg-[#00e676]' : 'bg-gray-600'}`}
            >
              <div className={`w-2.5 h-2.5 bg-black rounded-full transition-transform ${botActive ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <div className="text-[11px] text-gray-400 leading-snug">
            {aiTelemetry.lastReason}
          </div>
        </div>
      </div>

      {/* 6. ALL WORLD MARKETS MODAL */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#14161a] border border-[#262931] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#262931] flex items-center justify-between">
              <div className="text-lg font-black text-white flex items-center gap-2">
                <Globe size={20} className="text-[#00e676]" /> All World Markets
              </div>
              <button 
                onClick={() => setIsAssetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1b1e24] hover:bg-[#262931] text-gray-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 p-3 bg-[#121316] overflow-x-auto text-xs font-semibold">
              {['ALL', 'India', 'Global', 'USA', 'Crypto', 'Commodities'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setMarketFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                    marketFilter === cat ? 'bg-[#00e676] text-black font-black' : 'bg-[#1a1c21] text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setLatestPrice(asset.base);
                    setIsAssetModalOpen(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a1c21] hover:bg-[#22252c] border border-[#262931] hover:border-[#00e676]/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#242730] flex items-center justify-center font-black text-sm text-white">
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