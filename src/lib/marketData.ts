import { OHLCVBar, Timeframe } from './constants';

function timeframeToRange(tf: Timeframe): { range: string; interval: string } {
  switch (tf) {
    case '1D': return { range: '1d', interval: '5m' };
    case '1W': return { range: '5d', interval: '15m' };
    case '1M': return { range: '1mo', interval: '1h' };
    case '3M': return { range: '3mo', interval: '1d' };
    case '1Y': return { range: '1y', interval: '1d' };
  }
}

const CRYPTO_TICKERS = ['BTC-USD', 'ETH-USD'];

function fillEquityGaps(bars: OHLCVBar[], maxGapSeconds: number): OHLCVBar[] {
  if (bars.length < 2) return bars;
  const filled: OHLCVBar[] = [bars[0]];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1];
    const curr = bars[i];
    const diff = curr.time - prev.time;
    if (diff > maxGapSeconds) {
      const step = Math.round(diff / Math.round(diff / (maxGapSeconds * 0.55)));
      const count = Math.round(diff / step) - 1;
      for (let j = 1; j <= count; j++) {
        const t = j / (count + 1);
        filled.push({
          time: prev.time + j * step,
          open: prev.close + (curr.open - prev.close) * ((j - 1) / count),
          close: prev.close + (curr.open - prev.close) * (j / count),
          high: (prev.high + curr.high) / 2,
          low: (prev.low + curr.low) / 2,
          volume: Math.round((prev.volume + curr.volume) / 2),
        });
      }
    }
    filled.push(curr);
  }
  return filled;
}

export async function fetchHistoricalData(ticker: string, timeframe: Timeframe): Promise<OHLCVBar[]> {
  const { range, interval } = timeframeToRange(timeframe);
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Failed to fetch');
    
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No data');
    
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    
    let bars: OHLCVBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open?.[i] != null && quote.close?.[i] != null) {
        bars.push({
          time: timestamps[i],
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0,
        });
      }
    }

    // Remove weekend bars for equities (Sat=6, Sun=0) — keeps crypto intact
    if (!CRYPTO_TICKERS.includes(ticker)) {
      bars = bars.filter(b => {
        const day = new Date(b.time * 1000).getUTCDay();
        return day !== 0 && day !== 6;
      });
    }

    // Fill gaps for equity 1W data (>9 days = 777600s) — skip crypto
    if (timeframe === '1W' && !CRYPTO_TICKERS.includes(ticker)) {
      bars = fillEquityGaps(bars, 777600);
    }

    return bars;
  } catch {
    return generateMockData(ticker, timeframe);
  }
}

export async function fetchIntradayCloses(ticker: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=5m`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];
    const closes: number[] = [];
    const quote = result.indicators?.quote?.[0];
    if (!quote?.close) return [];
    for (let i = 0; i < quote.close.length; i++) {
      if (quote.close[i] != null) closes.push(quote.close[i]);
    }
    return closes;
  } catch {
    return [];
  }
}

function generateMockData(ticker: string, timeframe: Timeframe): OHLCVBar[] {
  const { SEED_PRICES } = require('./constants');
  const basePrice = SEED_PRICES[ticker] || 100;
  const count = timeframe === '1D' ? 78 : timeframe === '1W' ? 160 : timeframe === '1M' ? 160 : timeframe === '3M' ? 63 : 252;
  const now = Math.floor(Date.now() / 1000);
  const step = timeframe === '1D' ? 300 : timeframe === '1W' ? 900 : timeframe === '1M' ? 3600 : 86400;
  
  const bars: OHLCVBar[] = [];
  let price = basePrice * 0.9;
  
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

export function generateOrderBook(currentPrice: number): { bids: { price: number; size: number }[]; asks: { price: number; size: number }[] } {
  const bids: { price: number; size: number }[] = [];
  const asks: { price: number; size: number }[] = [];
  const spread = currentPrice * 0.0002;
  
  for (let i = 0; i < 15; i++) {
    const bidPrice = currentPrice - spread / 2 - i * currentPrice * 0.0003 * (1 + Math.random() * 0.5);
    const askPrice = currentPrice + spread / 2 + i * currentPrice * 0.0003 * (1 + Math.random() * 0.5);
    bids.push({ price: Number(bidPrice.toFixed(2)), size: Math.floor(Math.random() * 5000) + 100 });
    asks.push({ price: Number(askPrice.toFixed(2)), size: Math.floor(Math.random() * 5000) + 100 });
  }
  
  return { bids, asks };
}
