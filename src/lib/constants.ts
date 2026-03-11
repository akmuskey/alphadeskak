export const WATCHED_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
  'WMT', 'PG', 'UNH', 'HD', 'DIS', 'NFLX', 'PYPL', 'INTC', 'AMD', 'CRM'
];

export const TICKER_BAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC-USD', 'ETH-USD', 'SPY', 'QQQ'
];

export const SEED_PRICES: Record<string, number> = {
  'AAPL': 178.50, 'MSFT': 378.90, 'GOOGL': 141.20, 'AMZN': 178.30, 'TSLA': 248.50,
  'META': 505.75, 'NVDA': 875.30, 'JPM': 198.40, 'V': 282.15, 'JNJ': 156.80,
  'WMT': 168.25, 'PG': 162.30, 'UNH': 528.90, 'HD': 362.70, 'DIS': 112.40,
  'NFLX': 628.50, 'PYPL': 63.20, 'INTC': 31.45, 'AMD': 164.80, 'CRM': 272.35,
  'BTC-USD': 67450.00, 'ETH-USD': 3520.00, 'SPY': 502.30, 'QQQ': 435.60,
};

export const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'] as const;
export type Timeframe = typeof TIMEFRAMES[number];

export interface TickerPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  prevPrice: number;
  history: number[];
}

export interface PortfolioPosition {
  id: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OHLCVBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
