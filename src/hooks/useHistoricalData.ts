import { useState, useEffect } from 'react';
import { OHLCVBar, Timeframe } from '@/lib/constants';
import { fetchHistoricalData } from '@/lib/marketData';

export function useHistoricalData(ticker: string, timeframe: Timeframe) {
  const [data, setData] = useState<OHLCVBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHistoricalData(ticker, timeframe)
      .then(bars => {
        if (!cancelled) {
          setData(bars);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [ticker, timeframe]);

  return { data, loading, error };
}
