import { useState, useEffect, useMemo } from 'react';
import { TickerPrice, WATCHED_TICKERS } from '@/lib/constants';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function useSentimentScore(prices: Record<string, TickerPrice>) {
  const [score, setScore] = useState(50);

  const calculate = useMemo(() => {
    return () => {
      const tickers = WATCHED_TICKERS.map(s => prices[s]).filter(Boolean);
      if (tickers.length === 0) return 50;

      // 1. Price momentum (0-100): % of tickers that are up
      const upCount = tickers.filter(t => t.changePercent >= 0).length;
      const momentum = (upCount / tickers.length) * 100;

      // 2. Volatility (0-100): avg absolute change %, inverted (high vol = fear)
      const avgVolatility = tickers.reduce((s, t) => s + Math.abs(t.changePercent), 0) / tickers.length;
      // Normalize: 0% change = 100 (no fear), 3%+ = 0 (extreme fear)
      const volatility = clamp(100 - (avgVolatility / 3) * 100, 0, 100);

      // 3. Market breadth (0-100): gainers vs losers ratio
      const losers = tickers.length - upCount;
      const breadth = losers === 0 ? 100 : clamp((upCount / (upCount + losers)) * 100, 0, 100);

      // 4. Volume signal (0-100): compare spread of change magnitudes
      const changes = tickers.map(t => Math.abs(t.changePercent));
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      const bigMoves = changes.filter(c => c > avgChange).length;
      const volumeSignal = clamp((bigMoves / tickers.length) * 100, 0, 100);

      // 5. RSI proxy (0-100): how close prices are to recent highs vs lows from history
      let rsiSum = 0;
      let rsiCount = 0;
      for (const t of tickers) {
        if (t.history && t.history.length > 2) {
          const hi = Math.max(...t.history);
          const lo = Math.min(...t.history);
          const range = hi - lo;
          if (range > 0) {
            rsiSum += ((t.price - lo) / range) * 100;
            rsiCount++;
          }
        }
      }
      const rsiProxy = rsiCount > 0 ? rsiSum / rsiCount : 50;

      // Equal weight composite
      return Math.round(clamp(
        (momentum + volatility + breadth + volumeSignal + rsiProxy) / 5,
        0, 100
      ));
    };
  }, [prices]);

  useEffect(() => {
    setScore(calculate());
    const interval = setInterval(() => setScore(calculate()), 30000);
    return () => clearInterval(interval);
  }, [calculate]);

  return score;
}
