import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Play, TrendingUp, TrendingDown, Activity, Target, BarChart3 } from 'lucide-react';
import { runBacktest, BacktestResult, StrategyType, Trade } from '@/lib/backtester';
import { fetchBacktesterData } from '@/lib/marketData';

const DATE_RANGES = ['3M', '6M', '1Y', '2Y'] as const;
type DateRange = typeof DATE_RANGES[number];

function getDaysForRange(range: DateRange): number {
  switch (range) {
    case '3M': return 63;
    case '6M': return 126;
    case '1Y': return 252;
    case '2Y': return 504;
  }
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function MetricCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border p-3 flex flex-col gap-1" style={{ background: 'rgba(19, 20, 43, 0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <span className={`font-mono text-lg font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function PnLChart({ result }: { result: BacktestResult }) {
  const { equityCurve, trades } = result;
  if (equityCurve.length === 0) return null;

  const values = equityCurve.map(p => p.value);
  const minVal = Math.min(...values) * 0.995;
  const maxVal = Math.max(...values) * 1.005;
  const range = maxVal - minVal || 1;

  const w = 800;
  const h = 200;
  const padX = 0;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = equityCurve.map((p, i) => {
    const x = padX + (i / (equityCurve.length - 1)) * chartW;
    const y = padY + chartH - ((p.value - minVal) / range) * chartH;
    return { x, y, ...p };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x.toFixed(1)} ${h} L ${points[0].x.toFixed(1)} ${h} Z`;

  const buySignals = points.filter(p => p.signal === 'buy');
  const sellSignals = points.filter(p => p.signal === 'sell');

  const finalVal = values[values.length - 1];
  const isPositive = finalVal >= 10000;

  // Grid lines
  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines }, (_, i) => minVal + (range * (i + 1)) / (gridLines + 1));

  return (
    <div className="mt-3 rounded-lg border border-border p-3" style={{ background: 'rgba(19, 20, 43, 0.4)' }}>
      <div className="text-xs text-muted-foreground mb-2">Portfolio Value Over Time</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 200 }}>
        <defs>
          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#00d395' : '#ff4d6d'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? '#00d395' : '#ff4d6d'} stopOpacity="0.02" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Grid */}
        {gridValues.map((v, i) => {
          const y = padY + chartH - ((v - minVal) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={w} y2={y} stroke="rgba(123, 97, 255, 0.1)" strokeWidth="0.5" />
              <text x={w - 4} y={y - 3} fill="rgba(160, 160, 200, 0.5)" fontSize="8" textAnchor="end" fontFamily="JetBrains Mono">
                ${Math.round(v).toLocaleString()}
              </text>
            </g>
          );
        })}
        {/* Area */}
        <path d={areaD} fill="url(#pnlGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke={isPositive ? '#00d395' : '#ff4d6d'} strokeWidth="1.5" filter="url(#lineGlow)" />
        {/* $10k baseline */}
        {(() => {
          const baseY = padY + chartH - ((10000 - minVal) / range) * chartH;
          return <line x1={padX} y1={baseY} x2={w} y2={baseY} stroke="rgba(160, 160, 200, 0.3)" strokeWidth="0.5" strokeDasharray="4 3" />;
        })()}
        {/* Buy signals */}
        {buySignals.map((p, i) => (
          <polygon key={`b${i}`} points={`${p.x},${p.y + 8} ${p.x - 4},${p.y + 15} ${p.x + 4},${p.y + 15}`} fill="#00d395" opacity="0.9" />
        ))}
        {/* Sell signals */}
        {sellSignals.map((p, i) => (
          <polygon key={`s${i}`} points={`${p.x},${p.y - 8} ${p.x - 4},${p.y - 15} ${p.x + 4},${p.y - 15}`} fill="#ff4d6d" opacity="0.9" />
        ))}
      </svg>
    </div>
  );
}

function TradesTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) return <div className="text-xs text-muted-foreground mt-3 text-center py-4">No trades executed</div>;

  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden" style={{ background: 'rgba(19, 20, 43, 0.4)' }}>
      <div className="text-xs text-muted-foreground px-3 py-2 border-b border-border">Trade History</div>
      <div className="max-h-[200px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-3 py-1.5 text-left font-medium">Entry Date</th>
              <th className="px-3 py-1.5 text-left font-medium">Exit Date</th>
              <th className="px-3 py-1.5 text-right font-medium">Entry Price</th>
              <th className="px-3 py-1.5 text-right font-medium">Exit Price</th>
              <th className="px-3 py-1.5 text-right font-medium">Return %</th>
              <th className="px-3 py-1.5 text-center font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-3 py-1.5 font-mono">{formatDate(t.entryDate)}</td>
                <td className="px-3 py-1.5 font-mono">{formatDate(t.exitDate)}</td>
                <td className="px-3 py-1.5 text-right font-mono">${t.entryPrice.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right font-mono">${t.exitPrice.toFixed(2)}</td>
                <td className={`px-3 py-1.5 text-right font-mono ${t.returnPct >= 0 ? 'text-[hsl(var(--terminal-green))]' : 'text-[hsl(var(--terminal-red))]'}`}>
                  {t.returnPct >= 0 ? '+' : ''}{t.returnPct.toFixed(2)}%
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.result === 'win' ? 'bg-[hsl(var(--terminal-green)/0.15)] text-[hsl(var(--terminal-green))]' : 'bg-[hsl(var(--terminal-red)/0.15)] text-[hsl(var(--terminal-red))]'}`}>
                    {t.result === 'win' ? 'WIN' : 'LOSS'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StrategyBacktester({ selectedTicker }: { selectedTicker: string }) {
  const [expanded, setExpanded] = useState(false);
  const [ticker, setTicker] = useState(selectedTicker);
  const [strategy, setStrategy] = useState<StrategyType>('sma_crossover');
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Sync ticker with parent
  useMemo(() => setTicker(selectedTicker), [selectedTicker]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResult(null);

    try {
      const days = getDaysForRange(dateRange);
      const bars = await fetchBacktesterData(ticker, days);
      const res = runBacktest(bars, strategy);
      setResult(res);
    } finally {
      setRunning(false);
    }
  }, [ticker, strategy, dateRange]);

  const returnColor = (result?.totalReturn ?? 0) >= 0 ? 'text-[hsl(var(--terminal-green))]' : 'text-[hsl(var(--terminal-red))]';
  const sharpeVal = result?.sharpeRatio;
  const sharpeColor = sharpeVal === null ? 'text-muted-foreground' : sharpeVal >= 1 ? 'text-[hsl(var(--terminal-green))]' : sharpeVal >= 0.5 ? 'text-[hsl(var(--terminal-yellow))]' : 'text-[hsl(var(--terminal-red))]';

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'rgba(19, 20, 43, 0.6)', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Strategy Backtester</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">BETA</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Ticker */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                className="w-24 h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {/* Strategy */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Strategy</label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value as StrategyType)}
                className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="sma_crossover">SMA Crossover (20/50)</option>
                <option value="rsi_oversold">RSI Oversold (14)</option>
              </select>
            </div>
            {/* Date Range */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Period</label>
              <div className="flex h-8 rounded-md border border-border overflow-hidden">
                {DATE_RANGES.map(r => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-2.5 text-xs font-medium transition-colors ${dateRange === r ? 'bg-primary/30 text-primary' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={running}
              className="h-8 px-4 rounded-md text-xs font-semibold text-primary-foreground flex items-center gap-1.5 transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #7b61ff, #00d4ff)',
                boxShadow: '0 0 20px rgba(123, 97, 255, 0.3)',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 30px rgba(123, 97, 255, 0.6)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(123, 97, 255, 0.3)')}
            >
              <Play size={12} />
              {running ? 'Running...' : 'Run Backtest'}
            </button>
          </div>

          {/* Loading */}
          {running && (
            <div className="h-1 rounded-full overflow-hidden bg-secondary">
              <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: 'linear-gradient(90deg, #7b61ff, #00d4ff)' }} />
            </div>
          )}

          {/* Results */}
          {result && !running && (
            <div className="space-y-0">
              {/* Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <MetricCard label="Total Return" value={`${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)}%`} color={returnColor} icon={TrendingUp} />
                <MetricCard label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} color={sharpeColor} icon={BarChart3} />
                <MetricCard label="Max Drawdown" value={`${result.maxDrawdown.toFixed(2)}%`} color="text-[hsl(var(--terminal-red))]" icon={TrendingDown} />
                <MetricCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} color="text-foreground" icon={Target} />
                <MetricCard label="Trades" value={`${result.numTrades}`} color="text-foreground" icon={Activity} />
              </div>

              {/* P&L Chart */}
              <PnLChart result={result} />

              {/* Trades Table */}
              <TradesTable trades={result.trades} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
