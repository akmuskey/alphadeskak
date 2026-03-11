import { TickerPrice, TICKER_BAR_SYMBOLS } from '@/lib/constants';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TickerBarProps {
  prices: Record<string, TickerPrice>;
  flashMap: Record<string, 'up' | 'down' | null>;
  onSelect: (ticker: string) => void;
}

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="w-12 h-4 inline-block">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={up ? 'hsl(155, 100%, 50%)' : 'hsl(0, 100%, 60%)'}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TickerBar({ prices, flashMap, onSelect }: TickerBarProps) {
  const items = TICKER_BAR_SYMBOLS.map(sym => prices[sym]).filter(Boolean);
  const doubled = [...items, ...items]; // duplicate for seamless scroll

  return (
    <div className="w-full bg-card border-b border-border overflow-hidden h-9 flex items-center">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((t, i) => {
          const up = t.changePercent >= 0;
          const flash = flashMap[t.symbol];
          return (
            <button
              key={`${t.symbol}-${i}`}
              onClick={() => onSelect(t.symbol)}
              className={`inline-flex items-center gap-2 px-4 font-mono text-xs hover:bg-secondary transition-colors ${
                flash === 'up' ? 'flash-green' : flash === 'down' ? 'flash-red' : ''
              }`}
            >
              <span className="text-foreground font-medium">{t.symbol}</span>
              <span className={up ? 'price-up' : 'price-down'}>
                {t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`${up ? 'price-up' : 'price-down'} text-[10px]`}>
                {up ? '+' : ''}{t.changePercent.toFixed(2)}%
              </span>
              <MiniSparkline data={t.history} up={up} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
