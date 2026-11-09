import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Zap, 
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
  Layers,
  Check,
  X
} from 'lucide-react';

const ALL_MARKETS = [
  // India (NSE / Groww)
  { id: 'NIFTY50', name: 'NIFTY 50', country: 'India', category: 'Indices', payout: 82, base: 22450.0, step: 4.2, currency: '₹' },
  { id: 'BANKNIFTY', name: 'BANK NIFTY', country: 'India', category: 'Indices', payout: 82, base: 47920.0, step: 8.5, currency: '₹' },
  { id: 'RELIANCE', name: 'Reliance Ind.', country: 'India', category: 'Stocks', payout: 80, base: 2855.40, step: 0.9, currency: '₹' },
  { id: 'TCS', name: 'TCS Ltd.', country: 'India', category: 'Stocks', payout: 80, base: 3892.15, step: 1.2, currency: '₹' },
  { id: 'HDFCBANK', name: 'HDFC Bank', country: 'India', category: 'Stocks', payout: 80, base: 1530.10, step: 0.6, currency: '₹' },

  // Forex & OTC
  { id: 'EURUSD_OTC', name: 'EUR/USD (OTC)', country: 'Global', category: 'OTC Forex', payout: 92, base: 1.08642, step: 0.00018, currency: '$' },
  { id: 'GBPUSD_OTC', name: 'GBP/USD (OTC)', country: 'Global', category: 'OTC Forex', payout: 89, base: 1.27315, step: 0.00022, currency: '$' },
  { id: 'USDJPY', name: 'USD/JPY', country: 'Global', category: 'Forex', payout: 85, base: 154.62, step: 0.04, currency: '¥' },
  { id: 'USDINR', name: 'USD/INR', country: 'India', category: 'Forex', payout: 84, base: 83.45, step: 0.03, currency: '₹' },

  // US Tech
  { id: 'NVDA', name: 'NVIDIA Corp', country: 'USA', category: 'US Stocks', payout: 87, base: 885.30, step: 1.5, currency: '$' },
  { id: 'AAPL', name: 'Apple Inc.', country: 'USA', category: 'US Stocks', payout: 85, base: 182.40, step: 0.5, currency: '$' },
  { id: 'TSLA', name: 'Tesla Inc.', country: 'USA', category: 'US Stocks', payout: 88, base: 175.80, step: 0.9, currency: '$' },

  // Crypto & Commodities
  { id: 'BTCUSDT', name: 'Bitcoin (BTC)', country: 'Crypto', category: 'Crypto', payout: 90, base: 88450.0, step: 24.0, currency: '$' },
  { id: 'ETHUSDT', name: 'Ethereum (ETH)', country: 'Crypto', category: 'Crypto', payout: 88, base: 3340.50, step: 2.1, currency: '$' },
  { id: 'XAUUSD', name: 'Gold (XAU/USD)', country: 'Commodities', category: 'Metals', payout: 86, base: 2335.80, step: 0.8, currency: '$' }
];

const TIMEFRAMES = [
  { label: '5s', sec: 5, candleCount: 45 },
  { label: '15s', sec: 15, candleCount: 45 },
  { label: '1m', sec: 60, candleCount: 50 },
  { label: '5m', sec: 300, candleCount: 50 },
  { label: '15m', sec: 900, candleCount: 50 },
  { label: '1H', sec: 3600, candleCount: 55 },
  { label: '1D', sec: 86400, candleCount: 60 },
  { label: '1W', sec: 604800, candleCount: 65 },
  { label: '1M', sec: 2592000, candleCount: 70 },
  { label: '1Y', sec: 31536000, candleCount: 75 },
  { label: '5Y', sec: 157680000, candleCount: 80 }
];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState(ALL_MARKETS[0]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [chartType, setChartType] = useState('candles');
  const [selectedTf, setSelectedTf] = useState(TIMEFRAMES[0]);
  const [balance, setBalance] = useState(99160.0);
  const [amount, setAmount] = useState(70);
  const [durationSec, setDurationSec] = useState(5);
  const [botActive, setBotActive] = useState(true);
  
  // Indicator Toggles
  const [activeIndicators, setActiveIndicators] = useState({
    ema: true,
    bollinger: true,
    volume: true,
    rsi: true,
    macd: true
  });

  const [latestPrice, setLatestPrice] = useState(selectedAsset.base);
  const [countdown, setCountdown] = useState(5);
  const [candles, setCandles] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [selectedTab, setSelectedTab] = useState('open'); // 'open' | 'closed'
  
  const [recentSocialTrades, setRecentSocialTrades] = useState([
    { id: 1, user: 'AI Quant Engine', dir: 'UP', duration: '5s' },
    { id: 2, user: 'NiftyScalper', dir: 'DOWN', duration: '15s' }
  ]);
  
  const [aiTelemetry, setAiTelemetry] = useState({
    rsi: 52.4,
    trend: 'BULLISH',
    winRate: 86,
    lastReason: 'Scanning multi-indicator confirmations...'
  });

  const canvasRef = useRef(null);

  // Generate Candle History
  useEffect(() => {
    let p = selectedAsset.base;
    const count = selectedTf.candleCount;
    const initialList = [];
    const multiplier = selectedTf.sec > 86400 ? (selectedTf.sec / 86400) * 0.15 : 1;

    for (let i = 0; i < count; i++) {
      const open = p;
      const drift = (Math.random() - 0.492) * (selectedAsset.step * 2.2 * multiplier);
      const close = Number((open + drift).toFixed(selectedAsset.step < 0.01 ? 5 : 2));
      const high = Number((Math.max(open, close) + Math.random() * selectedAsset.step * multiplier).toFixed(selectedAsset.step < 0.01 ? 5 : 2));
      const low = Number((Math.min(open, close) - Math.random() * selectedAsset.step * multiplier).toFixed(selectedAsset.step < 0.01 ? 5 : 2));
      const volume = Math.floor(Math.random() * 8000 + 1200);
      initialList.push({ open, high, low, close, volume });
      p = close;
    }
    setCandles(initialList);
    setLatestPrice(p);
  }, [selectedAsset, selectedTf]);

  // Real-Time High-Frequency Candle Engine & Quant Scanner
  useEffect(() => {
    const timer = setInterval(() => {
      setCandles(prev => {
        if (!prev || prev.length === 0) return prev;
        const list = [...prev];
        const last = { ...list[list.length - 1] };
        const change = (Math.random() - 0.495) * selectedAsset.step;
        const newClose = Number((last.close + change).toFixed(selectedAsset.step < 0.01 ? 5 : 2));

        last.close = newClose;
        last.high = Math.max(last.high, newClose);
        last.low = Math.min(last.low, newClose);
        last.volume = (last.volume || 2000) + Math.floor(Math.random() * 80);
        list[list.length - 1] = last;

        setLatestPrice(newClose);

        // Technical Calculation: RSI(14)
        if (list.length >= 14) {
          let gains = 0, losses = 0;
          for (let i = list.length - 14; i < list.length; i++) {
            const diff = list[i].close - list[i].open;
            if (diff >= 0) gains += diff;
            else losses += Math.abs(diff);
          }
          const rs = losses === 0 ? 100 : gains / losses;
          const currentRsi = Number((100 - (100 / (1 + rs))).toFixed(1));

          // Automated AI Execution Engine
          if (botActive && activeTrades.length < 3) {
            if (currentRsi < 32 && Math.random() > 0.45) {
              setAiTelemetry({
                rsi: currentRsi,
                trend: 'OVERSOLD REVERSAL',
                winRate: 88,
                lastReason: 'RSI Oversold (' + currentRsi + ') + Lower Bollinger Band Bounce'
              });
              executeOrder('UP', true, 'RSI oversold reversal at ' + currentRsi);
            } else if (currentRsi > 68 && Math.random() > 0.45) {
              setAiTelemetry({
                rsi: currentRsi,
                trend: 'OVERBOUGHT EXHAUSTION',
                winRate: 86,
                lastReason: 'RSI Overbought (' + currentRsi + ') + Upper Bollinger Band Rejection'
              });
              executeOrder('DOWN', true, 'RSI overbought exhaustion at ' + currentRsi);
            } else {
              setAiTelemetry(t => ({
                ...t,
                rsi: currentRsi,
                trend: currentRsi > 50 ? 'BULLISH BIAS' : 'BEARISH BIAS'
              }));
            }
          }
        }

        return list;
      });

      // Update Active Orders Live Expiry & P&L
      setActiveTrades(prev => prev.map(tr => {
        const remaining = Math.max(0, tr.remaining - 1);
        const win = tr.direction === 'UP' ? latestPrice > tr.entry : latestPrice < tr.entry;
        const currentPnl = win ? Number((tr.amount * (tr.payout / 100)).toFixed(2)) : -tr.amount;
        return { ...tr, remaining, win, currentPnl };
      }));

      setCountdown(prev => (prev <= 1 ? durationSec : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAsset, botActive, activeTrades.length, durationSec, latestPrice]);

  // Order Lifecycle Manager
  useEffect(() => {
    const expired = activeTrades.filter(t => t.remaining <= 0);
    if (expired.length > 0) {
      expired.forEach(trade => {
        const win = trade.direction === 'UP' ? latestPrice > trade.entry : latestPrice < trade.entry;
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

  // Canvas Multi-Indicator Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0 || !canvas.parentElement) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 800;
    const height = canvas.parentElement.clientHeight || 500;

    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    ctx.fillStyle = '#131518';
    ctx.fillRect(0, 0, width, height);

    // 1. Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

    // Dynamic price scale
    let minP = Infinity;
    let maxP = -Infinity;
    candles.forEach(c => {
      minP = Math.min(minP, c.low);
      maxP = Math.max(maxP, c.high);
    });
    const padding = (maxP - minP) * 0.22 || 0.001;
    minP -= padding;
    maxP += padding;

    const subChartHeight = activeIndicators.rsi || activeIndicators.macd ? 110 : 0;
    const chartHeight = height - subChartHeight - 90;
    const getY = (price) => chartHeight - ((price - minP) / (maxP - minP)) * chartHeight + 20;
    const candleWidth = Math.max(3, (width - 160) / candles.length - 3);

    // 2. Bollinger Bands (20, 2)
    if (activeIndicators.bollinger && candles.length >= 20) {
      const upperBand = [];
      const lowerBand = [];
      const middleBand = [];

      for (let i = 19; i < candles.length; i++) {
        const slice = candles.slice(i - 19, i + 1);
        const mean = slice.reduce((acc, c) => acc + c.close, 0) / 20;
        const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / 20;
        const stdDev = Math.sqrt(variance);

        const x = i * (candleWidth + 3) + 20 + candleWidth / 2;
        upperBand.push({ x, y: getY(mean + stdDev * 2) });
        lowerBand.push({ x, y: getY(mean - stdDev * 2) });
        middleBand.push({ x, y: getY(mean) });
      }

      // Fill Channel
      if (upperBand.length > 1) {
        ctx.beginPath();
        ctx.moveTo(upperBand[0].x, upperBand[0].y);
        upperBand.forEach(p => ctx.lineTo(p.x, p.y));
        for (let j = lowerBand.length - 1; j >= 0; j--) {
          ctx.lineTo(lowerBand[j].x, lowerBand[j].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 176, 255, 0.05)';
        ctx.fill();

        // Upper & Lower Curves
        ctx.strokeStyle = 'rgba(0, 176, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 3. Dual EMA (9 & 21)
    if (activeIndicators.ema && candles.length > 5) {
      const renderEma = (period, color) => {
        ctx.beginPath();
        const k = 2 / (period + 1);
        let ema = candles[0].close;
        candles.forEach((c, i) => {
          ema = c.close * k + ema * (1 - k);
          const x = i * (candleWidth + 3) + 20 + candleWidth / 2;
          const y = getY(ema);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };
      renderEma(9, '#00e676');
      renderEma(21, '#ff9800');
    }

    // 4. Volume Histogram
    if (activeIndicators.volume) {
      const maxVol = Math.max(...candles.map(c => c.volume || 1000));
      candles.forEach((c, i) => {
        const x = i * (candleWidth + 3) + 20;
        const vH = ((c.volume || 1000) / maxVol) * 45;
        ctx.fillStyle = c.close >= c.open ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 51, 102, 0.2)';
        ctx.fillRect(x, chartHeight + 20 - vH, candleWidth, vH);
      });
    }

    // 5. Candlesticks / Area / Line
    if (chartType === 'area' || chartType === 'line') {
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = i * (candleWidth + 3) + 20 + candleWidth / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (chartType === 'area') {
        const lastX = (candles.length - 1) * (candleWidth + 3) + 20 + candleWidth / 2;
        const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        gradient.addColorStop(0, 'rgba(0, 230, 118, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');
        ctx.lineTo(lastX, chartHeight + 20);
        ctx.lineTo(20, chartHeight + 20);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      candles.forEach((c, i) => {
        const x = i * (candleWidth + 3) + 20;
        const isUp = c.close >= c.open;
        const color = isUp ? '#00e676' : '#ff3366';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, getY(c.high));
        ctx.lineTo(x + candleWidth / 2, getY(c.low));
        ctx.stroke();

        const topY = getY(Math.max(c.open, c.close));
        const bottomY = getY(Math.min(c.open, c.close));
        const bodyH = Math.max(2, bottomY - topY);

        ctx.fillStyle = color;
        ctx.fillRect(x, topY, candleWidth, bodyH);
      });
    }

    // 6. Sub-chart: RSI / MACD Oscillators
    if (activeIndicators.rsi || activeIndicators.macd) {
      const subTop = height - subChartHeight;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, subTop);
      ctx.lineTo(width, subTop);
      ctx.stroke();

      // RSI Oscillator Panel
      if (activeIndicators.rsi) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, subTop, width, subChartHeight);

        // 70 & 30 Lines
        const y70 = subTop + subChartHeight * 0.3;
        const y30 = subTop + subChartHeight * 0.7;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y70); ctx.lineTo(width, y70);
        ctx.moveTo(0, y30); ctx.lineTo(width, y30);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.fillText('RSI(14) 70', 10, y70 - 3);
        ctx.fillText('30', 10, y30 + 10);

        // RSI Line
        ctx.beginPath();
        candles.forEach((c, i) => {
          const x = i * (candleWidth + 3) + 20 + candleWidth / 2;
          const rsiVal = 50 + ((c.close - c.open) / selectedAsset.step) * 15;
          const boundedRsi = Math.max(10, Math.min(90, rsiVal));
          const y = subTop + (1 - boundedRsi / 100) * subChartHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 7. Real-Time Price Guideline
    const curY = getY(latestPrice);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(width, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 8. Visual Order Execution Pins on Chart
    activeTrades.forEach(tr => {
      const trY = getY(tr.entry);
      const isUp = tr.direction === 'UP';
      
      // Node Dot
      ctx.fillStyle = isUp ? '#00e676' : '#ff3366';
      ctx.beginPath();
      ctx.arc(width - 130, trY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal Entry Target
      ctx.strokeStyle = isUp ? 'rgba(0, 230, 118, 0.7)' : 'rgba(255, 51, 102, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(width - 240, trY);
      ctx.lineTo(width - 30, trY);
      ctx.stroke();

      // Badge Callout
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(width - 120, trY - 10, 85, 20);
      ctx.strokeStyle = isUp ? '#00e676' : '#ff3366';
      ctx.strokeRect(width - 120, trY - 10, 85, 20);

      ctx.fillStyle = isUp ? '#00e676' : '#ff3366';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText((tr.isAi ? 'AI ' : '') + tr.direction + ' ' + selectedAsset.currency + tr.amount, width - 114, trY + 4);
    });

  }, [candles, latestPrice, chartType, activeTrades, activeIndicators]);

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
      win: true,
      currentPnl: Number((amount * (selectedAsset.payout / 100)).toFixed(2)),
      isAi,
      reason
    };

    setActiveTrades(prev => [newTrade, ...prev]);
    setRecentSocialTrades(prev => [
      { id: Date.now(), user: isAi ? 'AI Quant Engine' : 'You', dir: direction, duration: durationSec + 's' },
      ...prev.slice(0, 3)
    ]);
  };

  const totalUnrealizedPnl = activeTrades.reduce((acc, t) => acc + (t.currentPnl || 0), 0);
  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + (t.profit || 0), 0);

  const filteredAssets = ALL_MARKETS.filter(item => {
    const matchesCategory = marketFilter === 'ALL' || item.country === marketFilter || item.category === marketFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen bg-[#0e1013] text-[#e6edf3] font-sans overflow-hidden select-none">
      
      {/* 1. LEFT DOCK */}
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
          <button 
            onClick={() => setIsIndicatorsModalOpen(true)}
            className="text-gray-400 hover:text-white flex flex-col items-center gap-1 text-[10px]"
          >
            <Layers size={18} />
            Indicators
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-[10px] text-gray-500 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00e676] mr-1 animate-pulse"></span>
            8,940
          </div>
          <button className="text-gray-400 hover:text-white">
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* 2. CENTER TERMINAL */}
      <div className="flex-1 flex flex-col relative">
        
        {/* TOP BAR */}
        <div className="h-14 bg-[#131518] border-b border-[#1d2229] px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex bg-[#1a1e24] p-1 rounded-lg text-xs font-semibold">
              <button className="px-3 py-1 rounded bg-[#2a313d] text-white">Fixed Time</button>
              <button className="px-3 py-1 rounded text-gray-400 hover:text-white">Forex</button>
              <button className="px-3 py-1 rounded text-gray-400 hover:text-white">Stocks</button>
            </div>

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

            {/* Quick Indicators Pill Button */}
            <button
              onClick={() => setIsIndicatorsModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#1a1e24] hover:bg-[#252b35] border border-[#2e3744] px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 transition"
            >
              <Layers size={14} className="text-[#00e676]" />
              Indicators
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1a1e24] border border-[#2a313d] px-3 py-1.5 rounded-xl">
              <Bot size={16} className={botActive ? "text-[#00e676] animate-pulse" : "text-gray-400"} />
              <span className="text-xs font-bold text-gray-300">AI Autopilot</span>
              <button 
                onClick={() => setBotActive(!botActive)}
                className={'w-8 h-4 rounded-full p-0.5 transition-colors ' + (botActive ? 'bg-[#00e676]' : 'bg-gray-600')}
              >
                <div className={'w-3 h-3 bg-black rounded-full transition-transform ' + (botActive ? 'translate-x-4' : 'translate-x-0')}></div>
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
        <div className="flex-1 relative w-full h-full overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block" />
          
          {/* AI Signal Matrix Box */}
          <div className="absolute top-4 left-6 z-10 bg-[#131518]/90 backdrop-blur border border-[#2a313d] rounded-2xl p-3 flex items-center gap-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#00e676] animate-pulse" />
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Signal Matrix</div>
                <div className="text-xs font-mono font-black text-white">{aiTelemetry.trend}</div>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-700"></div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">RSI (14)</div>
              <div className={'text-xs font-mono font-black ' + (aiTelemetry.rsi < 35 ? 'text-[#00e676]' : aiTelemetry.rsi > 65 ? 'text-[#ff3366]' : 'text-gray-300')}>
                {aiTelemetry.rsi}
              </div>
            </div>
            <div className="h-6 w-px bg-gray-700"></div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">Win Edge</div>
              <div className="text-xs font-mono font-black text-[#00e676]">{aiTelemetry.winRate}%</div>
            </div>
          </div>

          {/* Timeframe Controls (5s up to 5 Years) */}
          <div className="absolute left-6 bottom-8 z-10 flex flex-col gap-2">
            <div className="bg-[#1a1e24]/90 backdrop-blur border border-[#2a313d] rounded-xl p-1 flex gap-1 text-xs overflow-x-auto max-w-xl scrollbar-none">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.label}
                  onClick={() => {
                    setSelectedTf(tf);
                    setDurationSec(Math.min(tf.sec, 300));
                  }}
                  className={'px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ' + (selectedTf.label === tf.label ? 'bg-[#2a313d] text-[#00e676]' : 'text-gray-400 hover:text-white')}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="bg-[#1a1e24]/90 backdrop-blur border border-[#2a313d] rounded-xl p-1 flex gap-1 text-xs w-fit">
              {['candles', 'area', 'line'].map(st => (
                <button
                  key={st}
                  onClick={() => setChartType(st)}
                  className={'px-2.5 py-1 rounded-lg capitalize font-bold transition ' + (chartType === st ? 'bg-[#00e676] text-black' : 'text-gray-400 hover:text-white')}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Countdown & Live Price */}
          <div className="absolute right-32 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            <div className="border-r border-dashed border-gray-400/40 h-72 flex flex-col justify-between text-[10px] text-gray-500 pr-1">
              <span>Trade start</span>
              <span>Trade end</span>
            </div>
            <div className="bg-[#1a1e24] border border-[#2a313d] text-white px-2.5 py-1 rounded-md text-xs font-mono font-black ml-2 shadow-xl flex items-center gap-2">
              <span className="text-[#ff9800]">00:0{countdown}</span>
              <span>{latestPrice.toFixed(selectedAsset.step < 0.01 ? 5 : 2)}</span>
            </div>
          </div>

          {/* Social Trade Stream */}
          <div className="absolute bottom-3 left-64 flex items-center gap-3 z-10 pointer-events-none">
            {recentSocialTrades.map(st => (
              <div key={st.id} className="bg-[#131518]/90 backdrop-blur border border-[#2a313d] rounded-full px-3 py-1 flex items-center gap-2 text-[11px] shadow-lg">
                <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white">👤</span>
                <span className="font-semibold text-gray-300">{st.user}</span>
                <span className={'font-black flex items-center ' + (st.dir === 'UP' ? 'text-[#00e676]' : 'text-[#ff3366]')}>
                  {st.duration + ' ' + (st.dir === 'UP' ? 'Up ↑' : 'Down ↓')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. BOTTOM LIVE EXECUTIONS & P&L DRAWER */}
        <div className="h-44 bg-[#131518] border-t border-[#1d2229] flex flex-col">
          {/* Header Bar */}
          <div className="h-10 border-b border-[#1d2229] px-6 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTab('open')}
                className={'text-xs font-bold transition flex items-center gap-1.5 ' + (selectedTab === 'open' ? 'text-[#00e676] border-b-2 border-[#00e676] pb-1' : 'text-gray-400 hover:text-white')}
              >
                Active Executions ({activeTrades.length})
              </button>
              <button
                onClick={() => setSelectedTab('closed')}
                className={'text-xs font-bold transition flex items-center gap-1.5 ' + (selectedTab === 'closed' ? 'text-[#00e676] border-b-2 border-[#00e676] pb-1' : 'text-gray-400 hover:text-white')}
              >
                Completed Orders ({closedTrades.length})
              </button>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-gray-400">Floating P&L: </span>
                <span className={'font-black ' + (totalUnrealizedPnl >= 0 ? 'text-[#00e676]' : 'text-[#ff3366]')}>
                  {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toFixed(2)}
                </span>
              </div>
              <div className="h-3 w-px bg-gray-700"></div>
              <div>
                <span className="text-gray-400">Realized P&L: </span>
                <span className={'font-black ' + (totalRealizedPnl >= 0 ? 'text-[#00e676]' : 'text-[#ff3366]')}>
                  {totalRealizedPnl >= 0 ? '+' : ''}₹{totalRealizedPnl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
            {selectedTab === 'open' ? (
              activeTrades.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No active orders running. Use the Up/Down buttons or activate AI Autopilot to trade.
                </div>
              ) : (
                activeTrades.map(tr => (
                  <div key={tr.id} className="bg-[#1a1e24] border border-[#2a313d] rounded-xl px-4 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={'font-black px-2 py-0.5 rounded text-[10px] ' + (tr.direction === 'UP' ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff3366]/20 text-[#ff3366]')}>
                        {tr.direction}
                      </span>
                      <span className="font-bold text-white">{tr.market}</span>
                      <span className="text-gray-400 font-mono">Entry: {tr.entry}</span>
                      <span className="text-gray-400 font-mono">Live: {latestPrice}</span>
                      {tr.isAi && <span className="text-[10px] bg-[#00b0ff]/20 text-[#00b0ff] px-2 py-0.5 rounded font-bold">AI</span>}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-32 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#00e676] h-full transition-all duration-1000"
                          style={{ width: `${(tr.remaining / tr.totalDuration) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-gray-400">{tr.remaining}s</span>
                      <span className={'font-mono font-black text-sm ' + (tr.currentPnl >= 0 ? 'text-[#00e676]' : 'text-[#ff3366]')}>
                        {tr.currentPnl >= 0 ? '+' : ''}₹{tr.currentPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : (
              closedTrades.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No closed order history yet.
                </div>
              ) : (
                closedTrades.map(tr => (
                  <div key={tr.id} className="bg-[#1a1e24] border border-[#2a313d] rounded-xl px-4 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={'font-black px-2 py-0.5 rounded text-[10px] ' + (tr.win ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff3366]/20 text-[#ff3366]')}>
                        {tr.win ? 'WIN' : 'LOSS'}
                      </span>
                      <span className="font-bold text-white">{tr.market}</span>
                      <span className="text-gray-400 font-mono">Entry: {tr.entry} → Exit: {tr.exit}</span>
                      <span className="text-gray-500 text-[10px]">{tr.closedAt}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">Stake: ₹{tr.amount}</span>
                      <span className={'font-mono font-black text-sm ' + (tr.profit >= 0 ? 'text-[#00e676]' : 'text-[#ff3366]')}>
                        {tr.profit >= 0 ? '+' : ''}₹{tr.profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* 4. RIGHT PANEL */}
      <div className="w-80 bg-[#131518] border-l border-[#1d2229] p-5 flex flex-col justify-between z-20">
        <div className="space-y-4">
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

          <button
            onClick={() => executeOrder('UP', false, 'Manual Up Trade')}
            className="w-full bg-[#00e676] hover:bg-[#00c853] active:scale-95 transition py-4 rounded-2xl text-black font-black text-xl flex items-center justify-between px-6 shadow-lg shadow-[#00e676]/20"
          >
            <span>Up</span>
            <TrendingUp size={28} />
          </button>

          <button
            onClick={() => executeOrder('DOWN', false, 'Manual Down Trade')}
            className="w-full bg-[#ff3366] hover:bg-[#e62e5c] active:scale-95 transition py-4 rounded-2xl text-white font-black text-xl flex items-center justify-between px-6 shadow-lg shadow-[#ff3366]/20"
          >
            <span>Down</span>
            <TrendingDown size={28} />
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-gray-400">Potential profit: </span>
            <span className="text-sm font-mono font-bold text-[#00e676]">
              +₹{(amount * (1 + selectedAsset.payout / 100)).toFixed(2)} ({selectedAsset.payout}%)
            </span>
          </div>
        </div>

        <div className="bg-[#1a1e24] border border-[#2a313d] rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Zap size={14} className="text-[#00e676]" /> Quant Edge Rationale
            </span>
            <span className="text-[10px] bg-[#00e676]/20 text-[#00e676] px-2 py-0.5 rounded font-mono font-bold">
              {aiTelemetry.winRate}% EDGE
            </span>
          </div>
          <div className="text-[11px] text-gray-400 leading-snug">
            {aiTelemetry.lastReason}
          </div>
        </div>
      </div>

      {/* 5. INDICATORS TOGGLE MODAL */}
      {isIndicatorsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#131518] border border-[#2a313d] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="text-lg font-black text-white flex items-center gap-2">
                <Layers size={20} className="text-[#00e676]" /> Technical Indicators
              </div>
              <button 
                onClick={() => setIsIndicatorsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1a1e24] hover:bg-[#252b35] text-gray-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'bollinger', name: 'Bollinger Bands (20, 2)', desc: 'Volatility channel & mean reversion bands' },
                { key: 'ema', name: 'Dual EMA (9 & 21)', desc: 'Institutional trend crossover lines' },
                { key: 'volume', name: 'Volume Histogram', desc: 'Tick intensity and volume spikes' },
                { key: 'rsi', name: 'RSI Oscillator (14)', desc: 'Overbought / oversold momentum panel' }
              ].map(ind => (
                <div 
                  key={ind.key}
                  onClick={() => setActiveIndicators(prev => ({ ...prev, [ind.key]: !prev[ind.key] }))}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1a1e24] hover:bg-[#252b35] border border-[#2e3744] cursor-pointer transition"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{ind.name}</div>
                    <div className="text-[11px] text-gray-400">{ind.desc}</div>
                  </div>
                  <div className={'w-6 h-6 rounded-lg flex items-center justify-center transition ' + (activeIndicators[ind.key] ? 'bg-[#00e676] text-black' : 'border border-gray-600')}>
                    {activeIndicators[ind.key] && <Check size={16} className="font-black" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. ASSET MODAL */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#131518] border border-[#2a313d] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
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

              <div className="flex gap-2 overflow-x-auto pb-2 text-xs font-semibold">
                {['ALL', 'India', 'USA', 'Global', 'Crypto', 'Commodities'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMarketFilter(cat)}
                    className={'px-3 py-1.5 rounded-xl whitespace-nowrap transition ' + (marketFilter === cat ? 'bg-[#00e676] text-black font-black' : 'bg-[#1a1e24] text-gray-400 hover:text-white')}
                  >
                    {cat}
                  </button>
                ))}
              </div>

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

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
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