import { useMemo } from 'react';
import { generateOrderBook } from '@/lib/marketData';
import { TickerPrice } from '@/lib/constants';

interface OrderBookProps {
  ticker: string;
  price: TickerPrice | undefined;
}

export default function OrderBook({ ticker, price }: OrderBookProps) {
  const book = useMemo(() => {
    return generateOrderBook(price?.price || 100);
  }, [price?.price]);

  const maxSize = Math.max(...book.bids.map(b => b.size), ...book.asks.map(a => a.size));
  const spread = book.asks[0] && book.bids[0] ? (book.asks[0].price - book.bids[0].price).toFixed(2) : '0.00';
  const decimals = 2;

  return (
    <div className="panel flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="font-mono text-xs text-foreground font-medium">ORDER BOOK</span>
        <span className="sim-badge">SIM</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col text-[10px] font-mono">
        {/* Asks */}
        <div className="flex-1 overflow-hidden flex flex-col justify-end px-2 py-1">
          {[...book.asks].reverse().map((level, i) => (
            <div key={`a-${i}`} className="flex items-center h-5 relative">
              <div
                className="absolute right-0 top-0 h-full"
                style={{
                  width: `${(level.size / maxSize) * 100}%`,
                  backgroundColor: 'rgba(255, 77, 109, 0.3)',
                  boxShadow: '0 0 8px rgba(255, 77, 109, 0.2)'
                }}
              />
              <span className="w-16 text-right relative z-10" style={{ color: '#ff4d6d' }}>{level.price.toFixed(decimals)}</span>
              <span className="flex-1 text-right text-muted-foreground relative z-10">{level.size.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="px-2 py-1.5 border-y border-border text-center">
          <span className="text-muted-foreground">Spread: </span>
          <span className="text-foreground">${spread}</span>
        </div>

        {/* Bids */}
        <div className="flex-1 overflow-hidden px-2 py-1">
          {book.bids.map((level, i) => (
            <div key={`b-${i}`} className="flex items-center h-5 relative">
              <div
                className="absolute right-0 top-0 h-full opacity-20"
                style={{
                  width: `${(level.size / maxSize) * 100}%`,
                  backgroundColor: '#00d395',
                }}
              />
              <span className="w-16 text-right price-up relative z-10">{level.price.toFixed(decimals)}</span>
              <span className="flex-1 text-right text-muted-foreground relative z-10">{level.size.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
