import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { OHLCVBar, Timeframe } from '@/lib/constants';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { calculateSMA, calculateBollingerBands } from '@/lib/indicators';
import TimeframeSelector from './TimeframeSelector';
import IndicatorToggles from './IndicatorToggles';

interface CandlestickChartProps {
  ticker: string;
}

function formatPrice(p: number): string {
  return p >= 1000 ? p.toFixed(0) : p >= 1 ? p.toFixed(2) : p.toFixed(4);
}

function formatDate(ts: number, tf: Timeframe): string {
  const d = new Date(ts * 1000);
  if (tf === '1D') {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  if (tf === '1W' || tf === '1M') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function formatVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toString();
}

interface CrosshairInfo {
  x: number;
  y: number;
  bar: OHLCVBar;
}

export default function CandlestickChart({ ticker }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [indicators, setIndicators] = useState({ sma20: false, sma50: false, bollinger: false });
  const [crosshair, setCrosshair] = useState<CrosshairInfo | null>(null);
  const { data, loading } = useHistoricalData(ticker, timeframe);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const margin = { top: 10, right: 60, bottom: 30, left: 0 };
  const chartHeight = dimensions.height * 0.75;
  const volumeHeight = dimensions.height * 0.20;
  const volumeTop = chartHeight + dimensions.height * 0.05;

  const innerW = dimensions.width - margin.left - margin.right;
  const innerH = chartHeight - margin.top;

  const computed = useMemo(() => {
    if (!data.length) return null;

    const priceMin = Math.min(...data.map(d => d.low));
    const priceMax = Math.max(...data.map(d => d.high));
    const pricePad = (priceMax - priceMin) * 0.05 || 1;
    const yMin = priceMin - pricePad;
    const yMax = priceMax + pricePad;

    const volMax = Math.max(...data.map(d => d.volume)) || 1;

    const candleW = Math.max(1, (innerW / data.length) * 0.7);
    const gap = innerW / data.length;

    const toX = (i: number) => margin.left + i * gap + gap / 2;
    const toY = (price: number) => margin.top + innerH * (1 - (price - yMin) / (yMax - yMin));
    const toVolY = (vol: number) => volumeTop + volumeHeight * (1 - vol / volMax);

    // Grid lines (5 horizontal)
    const gridLines: { y: number; label: string }[] = [];
    for (let i = 0; i <= 4; i++) {
      const price = yMin + (yMax - yMin) * (i / 4);
      gridLines.push({ y: toY(price), label: formatPrice(price) });
    }

    // Time labels (~6)
    const timeLabels: { x: number; label: string }[] = [];
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) {
      timeLabels.push({ x: toX(i), label: formatDate(data[i].time, timeframe) });
    }

    // Current price
    const lastBar = data[data.length - 1];
    const currentPriceY = toY(lastBar.close);

    // SMA / Bollinger overlays
    let sma20Path = '';
    let sma50Path = '';
    let bbUpperPath = '';
    let bbLowerPath = '';

    if (indicators.sma20) {
      const smaData = calculateSMA(data, 20);
      sma20Path = smaData.map((d, i) => {
        const idx = data.findIndex(b => b.time === d.time);
        if (idx < 0) return '';
        return `${i === 0 ? 'M' : 'L'}${toX(idx)},${toY(d.value)}`;
      }).join('');
    }

    if (indicators.sma50) {
      const smaData = calculateSMA(data, 50);
      sma50Path = smaData.map((d, i) => {
        const idx = data.findIndex(b => b.time === d.time);
        if (idx < 0) return '';
        return `${i === 0 ? 'M' : 'L'}${toX(idx)},${toY(d.value)}`;
      }).join('');
    }

    if (indicators.bollinger) {
      const bb = calculateBollingerBands(data, 20, 2);
      bbUpperPath = bb.upper.map((d, i) => {
        const idx = data.findIndex(b => b.time === d.time);
        if (idx < 0) return '';
        return `${i === 0 ? 'M' : 'L'}${toX(idx)},${toY(d.value)}`;
      }).join('');
      bbLowerPath = bb.lower.map((d, i) => {
        const idx = data.findIndex(b => b.time === d.time);
        if (idx < 0) return '';
        return `${i === 0 ? 'M' : 'L'}${toX(idx)},${toY(d.value)}`;
      }).join('');
    }

    return {
      yMin, yMax, volMax, candleW, gap, toX, toY, toVolY,
      gridLines, timeLabels, currentPriceY, lastBar,
      sma20Path, sma50Path, bbUpperPath, bbLowerPath,
    };
  }, [data, innerW, innerH, margin.left, margin.top, volumeTop, volumeHeight, timeframe, indicators]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!computed || !data.length || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const idx = Math.round((mx - margin.left - computed.gap / 2) / computed.gap);
    if (idx >= 0 && idx < data.length) {
      setCrosshair({ x: computed.toX(idx), y: my, bar: data[idx] });
    }
  }, [computed, data, margin.left]);

  const handleMouseLeave = useCallback(() => setCrosshair(null), []);

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
      <div className="flex-1 relative" ref={containerRef} style={{ width: '100%', minHeight: 0 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(19, 20, 43, 0.8)' }}>
            <div className="font-mono text-xs text-muted-foreground animate-pulse">Loading {ticker} data...</div>
          </div>
        )}
        {computed && data.length > 0 && (
          <svg
            width={dimensions.width}
            height={dimensions.height}
            style={{ display: 'block', width: '100%', height: '100%' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines */}
            {computed.gridLines.map((g, i) => (
              <g key={`grid-${i}`}>
                <line x1={margin.left} y1={g.y} x2={dimensions.width - margin.right} y2={g.y} stroke="rgba(123, 97, 255, 0.08)" strokeWidth={1} />
                <text x={dimensions.width - margin.right + 5} y={g.y + 3} fill="#8892b0" fontSize={10} fontFamily="JetBrains Mono, monospace">{g.label}</text>
              </g>
            ))}

            {/* Vertical grid lines at time labels */}
            {computed.timeLabels.map((t, i) => (
              <g key={`tl-${i}`}>
                <line x1={t.x} y1={margin.top} x2={t.x} y2={chartHeight} stroke="rgba(123, 97, 255, 0.08)" strokeWidth={1} />
                <text x={t.x} y={dimensions.height - 5} fill="#8892b0" fontSize={10} fontFamily="JetBrains Mono, monospace" textAnchor="middle">{t.label}</text>
              </g>
            ))}

            {/* Volume bars */}
            {data.map((bar, i) => {
              const x = computed.toX(i) - computed.candleW / 2;
              const isUp = bar.close >= bar.open;
              const vY = computed.toVolY(bar.volume);
              return (
                <rect
                  key={`vol-${i}`}
                  x={x}
                  y={vY}
                  width={Math.max(1, computed.candleW)}
                  height={volumeTop + volumeHeight - vY}
                  fill={isUp ? 'rgba(0, 211, 149, 0.2)' : 'rgba(255, 77, 109, 0.2)'}
                />
              );
            })}

            {/* Candlesticks */}
            {data.map((bar, i) => {
              const cx = computed.toX(i);
              const isUp = bar.close >= bar.open;
              const color = isUp ? '#00d395' : '#ff4d6d';
              const wickColor = isUp ? 'rgba(0, 211, 149, 0.53)' : 'rgba(255, 77, 109, 0.53)';
              const bodyTop = computed.toY(Math.max(bar.open, bar.close));
              const bodyBot = computed.toY(Math.min(bar.open, bar.close));
              const bodyH = Math.max(1, bodyBot - bodyTop);
              return (
                <g key={`c-${i}`}>
                  {/* Wick */}
                  <line x1={cx} y1={computed.toY(bar.high)} x2={cx} y2={computed.toY(bar.low)} stroke={wickColor} strokeWidth={1} />
                  {/* Body */}
                  <rect
                    x={cx - computed.candleW / 2}
                    y={bodyTop}
                    width={Math.max(1, computed.candleW)}
                    height={bodyH}
                    fill={color}
                  />
                </g>
              );
            })}

            {/* SMA 20 overlay */}
            {computed.sma20Path && (
              <path d={computed.sma20Path} fill="none" stroke="#7b61ff" strokeWidth={1} />
            )}

            {/* SMA 50 overlay */}
            {computed.sma50Path && (
              <path d={computed.sma50Path} fill="none" stroke="#00d4ff" strokeWidth={1} />
            )}

            {/* Bollinger Bands */}
            {computed.bbUpperPath && (
              <path d={computed.bbUpperPath} fill="none" stroke="#7b61ff" strokeWidth={1} strokeDasharray="4 2" />
            )}
            {computed.bbLowerPath && (
              <path d={computed.bbLowerPath} fill="none" stroke="#7b61ff" strokeWidth={1} strokeDasharray="4 2" />
            )}

            {/* Current price line */}
            <line
              x1={margin.left}
              y1={computed.currentPriceY}
              x2={dimensions.width - margin.right}
              y2={computed.currentPriceY}
              stroke="rgba(123, 97, 255, 0.5)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <rect
              x={dimensions.width - margin.right}
              y={computed.currentPriceY - 9}
              width={58}
              height={18}
              rx={2}
              fill="rgba(19, 20, 43, 0.9)"
              stroke="rgba(123, 97, 255, 0.4)"
              strokeWidth={1}
            />
            <text
              x={dimensions.width - margin.right + 5}
              y={computed.currentPriceY + 4}
              fill="#7b61ff"
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
            >
              {formatPrice(computed.lastBar.close)}
            </text>

            {/* Crosshair */}
            {crosshair && (
              <g>
                <line x1={crosshair.x} y1={margin.top} x2={crosshair.x} y2={chartHeight} stroke="rgba(123, 97, 255, 0.3)" strokeWidth={1} strokeDasharray="3 3" />
                <line x1={margin.left} y1={crosshair.y} x2={dimensions.width - margin.right} y2={crosshair.y} stroke="rgba(123, 97, 255, 0.3)" strokeWidth={1} strokeDasharray="3 3" />
                {/* OHLCV tooltip */}
                <rect x={crosshair.x + 10} y={margin.top} width={150} height={70} rx={4} fill="rgba(19, 20, 43, 0.95)" stroke="rgba(123, 97, 255, 0.3)" strokeWidth={1} />
                <text x={crosshair.x + 18} y={margin.top + 16} fill="#8892b0" fontSize={10} fontFamily="JetBrains Mono, monospace">
                  O: {formatPrice(crosshair.bar.open)}  H: {formatPrice(crosshair.bar.high)}
                </text>
                <text x={crosshair.x + 18} y={margin.top + 32} fill="#8892b0" fontSize={10} fontFamily="JetBrains Mono, monospace">
                  L: {formatPrice(crosshair.bar.low)}  C: {formatPrice(crosshair.bar.close)}
                </text>
                <text x={crosshair.x + 18} y={margin.top + 48} fill="#8892b0" fontSize={10} fontFamily="JetBrains Mono, monospace">
                  Vol: {formatVolume(crosshair.bar.volume)}
                </text>
                <text x={crosshair.x + 18} y={margin.top + 62} fill="#8892b0" fontSize={9} fontFamily="JetBrains Mono, monospace">
                  {new Date(crosshair.bar.time * 1000).toLocaleDateString()}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
