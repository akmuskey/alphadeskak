import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, HistogramSeries, LineSeries, Time, CandlestickData, HistogramData } from 'lightweight-charts';
import { OHLCVBar, Timeframe } from '@/lib/constants';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { calculateSMA, calculateBollingerBands } from '@/lib/indicators';
import TimeframeSelector from './TimeframeSelector';
import IndicatorToggles from './IndicatorToggles';

interface CandlestickChartProps {
  ticker: string;
}

export default function CandlestickChart({ ticker }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const overlayRefs = useRef<any[]>([]);

  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [indicators, setIndicators] = useState({ sma20: false, sma50: false, bollinger: false });
  const { data, loading } = useHistoricalData(ticker, timeframe);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#8892b0',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(123, 97, 255, 0.08)' },
        horzLines: { color: 'rgba(123, 97, 255, 0.08)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(123, 97, 255, 0.3)', width: 1, style: 2, labelBackgroundColor: 'rgba(19, 20, 43, 0.9)' },
        horzLine: { color: 'rgba(123, 97, 255, 0.3)', width: 1, style: 2, labelBackgroundColor: 'rgba(19, 20, 43, 0.9)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(123, 97, 255, 0.2)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(123, 97, 255, 0.2)',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d395',
      downColor: '#ff4d6d',
      borderUpColor: '#00d395',
      borderDownColor: '#ff4d6d',
      wickUpColor: '#00d39588',
      wickDownColor: '#ff4d6d88',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !data.length) return;

    const candles: CandlestickData[] = data.map(b => ({
      time: b.time as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    const volumes: HistogramData[] = data.map(b => ({
      time: b.time as Time,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(0, 211, 149, 0.2)' : 'rgba(255, 77, 109, 0.2)',
    }));

    candleRef.current.setData(candles);
    volumeRef.current.setData(volumes);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    overlayRefs.current.forEach(s => {
      try { chartRef.current?.removeSeries(s); } catch {}
    });
    overlayRefs.current = [];

    if (indicators.sma20) {
      const smaData = calculateSMA(data, 20);
      const series = chartRef.current.addSeries(LineSeries, { color: '#7b61ff', lineWidth: 1, priceLineVisible: false });
      series.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })));
      overlayRefs.current.push(series);
    }

    if (indicators.sma50) {
      const smaData = calculateSMA(data, 50);
      const series = chartRef.current.addSeries(LineSeries, { color: '#00d4ff', lineWidth: 1, priceLineVisible: false });
      series.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })));
      overlayRefs.current.push(series);
    }

    if (indicators.bollinger) {
      const bb = calculateBollingerBands(data, 20, 2);
      const upper = chartRef.current.addSeries(LineSeries, { color: '#7b61ff', lineWidth: 1, priceLineVisible: false, lineStyle: 2 });
      const lower = chartRef.current.addSeries(LineSeries, { color: '#7b61ff', lineWidth: 1, priceLineVisible: false, lineStyle: 2 });
      upper.setData(bb.upper.map(d => ({ time: d.time as Time, value: d.value })));
      lower.setData(bb.lower.map(d => ({ time: d.time as Time, value: d.value })));
      overlayRefs.current.push(upper, lower);
    }
  }, [data, indicators]);

  const toggleIndicator = (key: 'sma20' | 'sma50' | 'bollinger') => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-border gap-2">
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto mobile-scroll">
          <span className="font-mono text-sm font-semibold text-foreground shrink-0">{ticker}</span>
          <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
        </div>
        <IndicatorToggles
          sma20={indicators.sma20}
          sma50={indicators.sma50}
          bollinger={indicators.bollinger}
          onToggle={toggleIndicator}
        />
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(19, 20, 43, 0.8)' }}>
            <div className="font-mono text-xs text-muted-foreground animate-pulse">Loading {ticker} data...</div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
