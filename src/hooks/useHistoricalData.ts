import { useState, useEffect } from 'react';
import { OHLCVBar, Timeframe, SEED_PRICES } from '@/lib/constants';
import { fetchHistoricalData } from '@/lib/marketData';

function generateFallbackData(ticker: string, timeframe: Timeframe): OHLCVBar[] {
  const basePrice = SEED_PRICES[ticker] || 100;
  const count = timeframe === '1D' ? 78 : timeframe === '1W' ? 160 : timeframe === '1M' ? 160 : timeframe === '3M' ? 63 : 252;
  const now = Math.floor(Date.now() / 1000);
  const step = timeframe === '1D' ? 300 : timeframe === '1W' ? 900 : timeframe === '1M' ? 3600 : 86400;

  const bars: OHLCVBar[] = [];
  let price = basePrice * 0.95;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.02;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;

    bars.push({
      time: now - (count - i) * step,
      open, high, low, close,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
    price = close;
  }
  return bars;
}

export function useHistoricalData(ticker: string, timeframe: Timeframe) {
  const [data, setData] = useState<OHLCVBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timedOut = false;
    setLoading(true);
    setError(null);

    // Hard 3-second timeout — always fires fallback
    const timeout = setTimeout(() => {
      if (!cancelled) {
        timedOut = true;
        setData(generateFallbackData(ticker, timeframe));
        setLoading(false);
      }
    }, 3000);

    fetchHistoricalData(ticker, timeframe)
      .then(bars => {
        if (!cancelled && !timedOut) {
          clearTimeout(timeout);
          setData(bars);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled && !timedOut) {
          clearTimeout(timeout);
          setData(generateFallbackData(ticker, timeframe));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [ticker, timeframe]);

  return { data, loading, error };
}
