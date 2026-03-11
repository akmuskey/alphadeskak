import { TickerPrice, TICKER_BAR_SYMBOLS } from '@/lib/constants';

interface TickerBarProps {
  prices: Record<string, TickerPrice>;
  flashMap: Record<string, 'up' | 'down' | null>;
  onSelect: (ticker: string) => void;
}

function MiniSparkline({ symbol, up }: { symbol: string; up: boolean }) {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const points: number[] = [];
  let val = 50;
  const bias = up ? 0.4 : -0.4;
  for (let i = 0; i < 8; i++) {
    const pseudo = Math.sin(seed * 13.37 + i * 7.91) * 0.5 + 0.5;
    val += (pseudo * 2 - 1) + bias;
    points.push(val);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => `${(i / 7) * 40},${14 - ((p - min) / range) * 12 - 1}`).join(' ');

  return (
    <svg width="40" height="16" viewBox="0 0 40 16" fill="none" className="inline-block">
      <polyline points={coords} stroke={up ? '#00d395' : '#ff4d6d'} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function TickerBar({ prices, flashMap, onSelect }: TickerBarProps) {
  const items = TICKER_BAR_SYMBOLS.map(sym => prices[sym]).filter(Boolean);
  const doubled = [...items, ...items];

  return (
    <div className="w-full border-b overflow-hidden h-9 flex items-center" style={{ background: 'rgba(123, 97, 255, 0.08)', backdropFilter: 'blur(20px)', borderColor: 'rgba(123, 97, 255, 0.2)' }}>
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((t, i) => {
          const up = t.changePercent >= 0;
          const flash = flashMap[t.symbol];
          return (
            <button
              key={`${t.symbol}-${i}`}
              onClick={() => onSelect(t.symbol)}
              className={`inline-flex items-center gap-2 px-4 font-mono text-xs hover:bg-primary/10 transition-colors ${
                flash === 'up' ? 'flash-green' : flash === 'down' ? 'flash-red' : ''
              }`}
              style={{ borderRight: '1px solid rgba(123, 97, 255, 0.5)' }}
            >
              <span className="text-foreground font-medium">{t.symbol}</span>
              <MiniSparkline symbol={t.symbol} up={up} />
              <span className={up ? 'price-up' : 'price-down'}>
                {t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`${up ? 'price-up' : 'price-down'} text-[10px]`}>
                {up ? '+' : ''}{t.changePercent.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
