import { useMemo } from 'react';
import { TickerPrice, WATCHED_TICKERS } from '@/lib/constants';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketMoversProps {
  prices: Record<string, TickerPrice>;
  onSelect: (ticker: string) => void;
}

function MiniSparkline({ symbol, up }: { symbol: string; up: boolean }) {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const points: number[] = [];
  let val = 50;
  const bias = up ? 0.4 : -0.4;
  for (let i = 0; i < 12; i++) {
    const pseudo = Math.sin(seed * 13.37 + i * 7.91) * 0.5 + 0.5; // 0-1
    val += (pseudo * 2 - 1) + bias;
    points.push(val);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => `${(i / 11) * 50},${20 - ((p - min) / range) * 18 - 1}`).join(' ');

  return (
    <svg width="50" height="20" viewBox="0 0 50 20" fill="none">
      <polyline points={coords} stroke={up ? '#00d395' : '#ff4d6d'} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function MarketMovers({ prices, onSelect }: MarketMoversProps) {
  const { gainers, losers } = useMemo(() => {
    const sorted = WATCHED_TICKERS
      .map(sym => prices[sym])
      .filter(Boolean)
      .sort((a, b) => b.changePercent - a.changePercent);
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
  }, [prices]);

  const renderRow = (t: TickerPrice) => {
    const up = t.changePercent >= 0;
    return (
      <button
        key={t.symbol}
        onClick={() => onSelect(t.symbol)}
        className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-primary/10 transition-colors rounded-md"
      >
        <span className="font-mono text-[10px] text-foreground font-medium w-12 text-left">{t.symbol}</span>
        <MiniSparkline symbol={t.symbol} up={up} />
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