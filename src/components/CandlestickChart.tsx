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
  const candleRef = useRef<ISeriesApi<typeof CandlestickSeries> | null>(null);
  const volumeRef = useRef<ISeriesApi<typeof HistogramSeries> | null>(null);
  const overlayRefs = useRef<ISeriesApi<typeof LineSeries>[]>([]);

  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [indicators, setIndicators] = useState({ sma20: false, sma50: false, bollinger: false });
  const { data, loading } = useHistoricalData(ticker, timeframe);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#666680',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1e1e2e' },
        horzLines: { color: '#1e1e2e' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#00ff9d33', width: 1, style: 2, labelBackgroundColor: '#111118' },
        horzLine: { color: '#00ff9d33', width: 1, style: 2, labelBackgroundColor: '#111118' },
      },
      rightPriceScale: {
        borderColor: '#1e1e2e',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#1e1e2e',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9d',
      downColor: '#ff3b3b',
      borderUpColor: '#00ff9d',
      borderDownColor: '#ff3b3b',
      wickUpColor: '#00ff9d88',
      wickDownColor: '#ff3b3b88',
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
      color: b.close >= b.open ? '#00ff9d33' : '#ff3b3b33',
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
      const series = chartRef.current.addSeries(LineSeries, { color: '#00ff9d', lineWidth: 1, priceLineVisible: false });
      series.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })));
      overlayRefs.current.push(series);
    }

    if (indicators.sma50) {
      const smaData = calculateSMA(data, 50);
      const series = chartRef.current.addSeries(LineSeries, { color: '#ffcc00', lineWidth: 1, priceLineVisible: false });
      series.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })));
      overlayRefs.current.push(series);
    }

    if (indicators.bollinger) {
      const bb = calculateBollingerBands(data, 20, 2);
      const upper = chartRef.current.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lineStyle: 2 });
      const lower = chartRef.current.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lineStyle: 2 });
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-foreground">{ticker}</span>
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
          <div className="absolute inset-0 z-10 bg-card flex items-center justify-center">
            <div className="font-mono text-xs text-muted-foreground animate-pulse">Loading {ticker} data...</div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
