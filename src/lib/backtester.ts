import { OHLCVBar } from './constants';

export type StrategyType = 'sma_crossover' | 'rsi_oversold';

export interface Trade {
  entryDate: number;
  exitDate: number;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
  result: 'win' | 'loss';
}

export interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  numTrades: number;
  trades: Trade[];
  equityCurve: { time: number; value: number; signal?: 'buy' | 'sell' }[];
}

function calculateSMAArray(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += closes[i - j];
      result.push(sum / period);
    }
  }
  return result;
}

function calculateRSIArray(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  // Initial average gain/loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Wilder's smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

export function runBacktest(data: OHLCVBar[], strategy: StrategyType): BacktestResult {
  const INITIAL_CAPITAL = 10000;
  const closes = data.map(d => d.close);
  const times = data.map(d => d.time);

  // Generate signals
  const signals: ('buy' | 'sell' | null)[] = new Array(data.length).fill(null);

  if (strategy === 'sma_crossover') {
    const sma20 = calculateSMAArray(closes, 20);
    const sma50 = calculateSMAArray(closes, 50);
    for (let i = 1; i < data.length; i++) {
      if (sma20[i] === null || sma50[i] === null || sma20[i - 1] === null || sma50[i - 1] === null) continue;
      const prevAbove = sma20[i - 1]! > sma50[i - 1]!;
      const currAbove = sma20[i]! > sma50[i]!;
      if (!prevAbove && currAbove) signals[i] = 'buy';
      else if (prevAbove && !currAbove) signals[i] = 'sell';
    }
  } else {
    const rsi = calculateRSIArray(closes, 14);
    let wasBelow30 = false;
    let wasAbove70 = false;
    for (let i = 0; i < data.length; i++) {
      if (rsi[i] === null) continue;
      if (rsi[i]! < 30) wasBelow30 = true;
      if (rsi[i]! > 70) wasAbove70 = true;
      if (wasBelow30 && rsi[i]! >= 30) {
        signals[i] = 'buy';
        wasBelow30 = false;
      }
      if (wasAbove70 && rsi[i]! <= 70) {
        signals[i] = 'sell';
        wasAbove70 = false;
      }
    }
  }

  // Execute trades
  const trades: Trade[] = [];
  let position: { entryPrice: number; entryDate: number } | null = null;
  let cash = INITIAL_CAPITAL;
  let shares = 0;

  const equityCurve: { time: number; value: number; signal?: 'buy' | 'sell' }[] = [];

  for (let i = 0; i < data.length; i++) {
    const price = closes[i];
    let sig: 'buy' | 'sell' | undefined;

    if (signals[i] === 'buy' && !position) {
      shares = Math.floor(cash / price);
      if (shares > 0) {
        const cost = shares * price;
        cash -= cost;
        position = { entryPrice: price, entryDate: times[i] };
        sig = 'buy';
      }
    } else if (signals[i] === 'sell' && position) {
      const revenue = shares * price;
      cash += revenue;
      const returnPct = ((price - position.entryPrice) / position.entryPrice) * 100;
      trades.push({
        entryDate: position.entryDate,
        exitDate: times[i],
        entryPrice: position.entryPrice,
        exitPrice: price,
        returnPct,
        result: returnPct >= 0 ? 'win' : 'loss',
      });
      shares = 0;
      position = null;
      sig = 'sell';
    }

    const portfolioValue = cash + shares * price;
    equityCurve.push({ time: times[i], value: portfolioValue, signal: sig });
  }

  // Close any open position at end
  if (position && shares > 0) {
    const lastPrice = closes[closes.length - 1];
    const revenue = shares * lastPrice;
    cash += revenue;
    const returnPct = ((lastPrice - position.entryPrice) / position.entryPrice) * 100;
    trades.push({
      entryDate: position.entryDate,
      exitDate: times[times.length - 1],
      entryPrice: position.entryPrice,
      exitPrice: lastPrice,
      returnPct,
      result: returnPct >= 0 ? 'win' : 'loss',
    });
    shares = 0;
  }

  const finalValue = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].value : INITIAL_CAPITAL;
  const totalReturn = ((finalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;

  // Sharpe Ratio
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    dailyReturns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
  }
  const meanReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
  const riskFreeDaily = 0.02 / 252;
  const stdDev = dailyReturns.length > 1
    ? Math.sqrt(dailyReturns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / (dailyReturns.length - 1))
    : 0;
  const sharpeRatio = stdDev > 0
    ? Math.round(((meanReturn - riskFreeDaily) / stdDev * Math.sqrt(252)) * 100) / 100
    : 0;

  // Max Drawdown
  let peak = INITIAL_CAPITAL;
  let maxDD = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const dd = (point.value - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  const maxDrawdown = Math.round(maxDD * 10000) / 100;

  // Win Rate
  const wins = trades.filter(t => t.result === 'win').length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 10000) / 100 : 0;

  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    sharpeRatio,
    maxDrawdown,
    winRate,
    numTrades: trades.length,
    trades,
    equityCurve,
  };
}
