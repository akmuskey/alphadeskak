import { useState, useEffect, useCallback, useRef } from 'react';
import { SEED_PRICES, TICKER_BAR_SYMBOLS, WATCHED_TICKERS, TickerPrice } from '@/lib/constants';

const ALL_SYMBOLS = [...new Set([...TICKER_BAR_SYMBOLS, ...WATCHED_TICKERS])];

function initPrices(): Record<string, TickerPrice> {
  const prices: Record<string, TickerPrice> = {};
  ALL_SYMBOLS.forEach(sym => {
    const price = SEED_PRICES[sym] || 100;
    prices[sym] = {
      symbol: sym,
      price,
      change: 0,
      changePercent: 0,
      prevPrice: price,
      history: Array.from({ length: 24 }, () => price + (Math.random() - 0.5) * price * 0.02),
    };
  });
  return prices;
}

export function useSimulatedPrices() {
  const [prices, setPrices] = useState<Record<string, TickerPrice>>(initPrices);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const tick = useCallback(() => {
    setPrices(prev => {
      const next = { ...prev };
      const flashes: Record<string, 'up' | 'down' | null> = {};

      ALL_SYMBOLS.forEach(sym => {
        const p = next[sym];
        const volatility = sym.includes('BTC') || sym.includes('ETH') ? 0.003 : 0.001;
        const delta = (Math.random() - 0.48) * p.price * volatility;
        const newPrice = Math.max(p.price + delta, 0.01);
        const openPrice = SEED_PRICES[sym] || 100;
        
        flashes[sym] = newPrice > p.price ? 'up' : newPrice < p.price ? 'down' : null;
        
        next[sym] = {
          ...p,
          prevPrice: p.price,
          price: Number(newPrice.toFixed(2)),
          change: Number((newPrice - openPrice).toFixed(2)),
          changePercent: Number(((newPrice - openPrice) / openPrice * 100).toFixed(2)),
          history: [...p.history.slice(1), newPrice],
        };
      });

      setFlashMap(flashes);
      return next;
    });
    
    setTimeout(() => setFlashMap({}), 400);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(tick, 2500);
    return () => clearInterval(intervalRef.current);
  }, [tick]);

  return { prices, flashMap };
}
