import { useMemo } from 'react';
import { TickerPrice, WATCHED_TICKERS } from '@/lib/constants';
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
        <MiniSparkline data={t.history} up={up} />
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
        <div className="px-3 py-1 flex items-center gap-1.5 border-b border-border">
          <TrendingUp className="w-3 h-3 text-terminal-green" />
          <span className="font-mono text-[10px] text-terminal-green">GAINERS</span>
        </div>
        {gainers.map(renderRow)}

        <div className="px-3 py-1 flex items-center gap-1.5 border-b border-border mt-1">
          <TrendingDown className="w-3 h-3 text-destructive" />
          <span className="font-mono text-[10px] text-destructive">LOSERS</span>
        </div>
        {losers.map(renderRow)}
      </div>
    </div>
  );
}
