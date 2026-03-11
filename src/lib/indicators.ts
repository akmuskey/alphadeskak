import { OHLCVBar } from './constants';

export function calculateSMA(data: OHLCVBar[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

export function calculateBollingerBands(data: OHLCVBar[], period: number = 20, multiplier: number = 2) {
  const sma = calculateSMA(data, period);
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const smaIdx = i - (period - 1);
    if (smaIdx < 0 || smaIdx >= sma.length) continue;
    
    let sumSqDiff = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma[smaIdx].value;
      sumSqDiff += diff * diff;
    }
    const stdDev = Math.sqrt(sumSqDiff / period);
    upper.push({ time: data[i].time, value: sma[smaIdx].value + multiplier * stdDev });
    lower.push({ time: data[i].time, value: sma[smaIdx].value - multiplier * stdDev });
  }

  return { sma, upper, lower };
}
