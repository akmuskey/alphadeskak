import { useMemo, useEffect, useState, useRef } from 'react';
import { TickerPrice, WATCHED_TICKERS } from '@/lib/constants';
import { fetchIntradayCloses } from '@/lib/marketData';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketMoversProps {
  prices: Record<string, TickerPrice>;
  onSelect: (ticker: string) => void;
}

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="w-10 h-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={up ? '#00d395' : '#ff4d6d'} strokeWidth={1} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Cache real sparkline data per ticker
const sparklineCache: Record<string, number[]> = {};

function useRealSparklines(tickers: string[]) {
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toFetch = tickers.filter(t => !fetchedRef.current.has(t) && !sparklineCache[t]);
    if (toFetch.length === 0) {
      // All cached, just set from cache
      const cached: Record<string, number[]> = {};
      tickers.forEach(t => { if (sparklineCache[t]) cached[t] = sparklineCache[t]; });
      setSparklines(prev => ({ ...prev, ...cached }));
      return;
    }

    toFetch.forEach(ticker => {
      fetchedRef.current.add(ticker);
      fetchHistoricalData(ticker, '1D')
        .then(bars => {
          // Use close prices; if we got mock/random data (no real API), use flat line
          // Real data will have varying prices; detect mock by checking if bars exist
          const closes = bars.map(b => b.close);
          // Sample down to ~24 points for sparkline
          const step = Math.max(1, Math.floor(closes.length / 24));
          const sampled = closes.filter((_, i) => i % step === 0);
          // Check if data looks real (has some variance) - flat line fallback if all same
          const allSame = sampled.length > 0 && sampled.every(v => v === sampled[0]);
          const result = allSame ? [] : sampled;
          sparklineCache[ticker] = result;
          setSparklines(prev => ({ ...prev, [ticker]: result }));
        })
        .catch(() => {
          sparklineCache[ticker] = [];
          setSparklines(prev => ({ ...prev, [ticker]: [] }));
        });
    });
  }, [tickers.join(',')]);

  return sparklines;
}

export default function MarketMovers({ prices, onSelect }: MarketMoversProps) {
  const { gainers, losers } = useMemo(() => {
    const sorted = WATCHED_TICKERS
      .map(sym => prices[sym])
      .filter(Boolean)
      .sort((a, b) => b.changePercent - a.changePercent);
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
  }, [prices]);

  const visibleTickers = useMemo(() => [...gainers, ...losers].map(t => t.symbol), [gainers, losers]);
  const sparklines = useRealSparklines(visibleTickers);

  const renderRow = (t: TickerPrice) => {
    const realData = sparklines[t.symbol];
    // Determine direction from real data if available
    const hasRealData = realData && realData.length > 1;
    const up = hasRealData
      ? realData[realData.length - 1] >= realData[0]
      : t.changePercent >= 0;
    // Flat line fallback: use current price repeated
    const sparkData = hasRealData ? realData : [t.price, t.price];
    
    return (
      <button
        key={t.symbol}
        onClick={() => onSelect(t.symbol)}
        className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-primary/10 transition-colors rounded-md"
      >
        <span className="font-mono text-[10px] text-foreground font-medium w-12 text-left">{t.symbol}</span>
        <MiniSparkline data={sparkData} up={up} />
        <span className={`font-mono text-[10px] w-16 text-right ${up ? 'price-up' : 'price-down'}`}>
          {up ? '+' : ''}{t.changePercent.toFixed(2)}%
        </span>
      </button>
    );
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <span className="font-mono text-xs text-foreground font-medium">MARKET MOVERS</span>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="px-3 py-1 flex items-center gap-1.5 border-b border-border" style={{ boxShadow: '0 0 10px rgba(0, 211, 149, 0.15)' }}>
          <TrendingUp className="w-3 h-3" style={{ color: '#00d395' }} />
          <span className="font-mono text-[10px]" style={{ color: '#00d395' }}>GAINERS</span>
        </div>
        {gainers.map(renderRow)}

        <div className="px-3 py-1 flex items-center gap-1.5 border-b border-border mt-1" style={{ boxShadow: '0 0 10px rgba(255, 77, 109, 0.15)' }}>
          <TrendingDown className="w-3 h-3" style={{ color: '#ff4d6d' }} />
          <span className="font-mono text-[10px]" style={{ color: '#ff4d6d' }}>LOSERS</span>
        </div>
        {losers.map(renderRow)}
      </div>
    </div>
  );
}