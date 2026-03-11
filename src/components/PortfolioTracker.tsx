import { useState } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { TickerPrice } from '@/lib/constants';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { X, Plus } from 'lucide-react';

interface PortfolioTrackerProps {
  prices: Record<string, TickerPrice>;
}

const DONUT_COLORS = [
  'hsl(155, 100%, 50%)', 'hsl(210, 100%, 60%)', 'hsl(45, 100%, 60%)',
  'hsl(280, 100%, 60%)', 'hsl(0, 100%, 60%)', 'hsl(180, 100%, 50%)',
];

export default function PortfolioTracker({ prices }: PortfolioTrackerProps) {
  const { positions, addPosition, removePosition } = usePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ticker: '', quantity: '', avgPrice: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ticker && form.quantity && form.avgPrice) {
      addPosition(form.ticker, parseFloat(form.quantity), parseFloat(form.avgPrice));
      setForm({ ticker: '', quantity: '', avgPrice: '' });
      setShowForm(false);
    }
  };

  const portfolioData = positions.map(pos => {
    const current = prices[pos.ticker]?.price || pos.avgPrice;
    const value = current * pos.quantity;
    const cost = pos.avgPrice * pos.quantity;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...pos, current, value, pnl, pnlPct };
  });

  const totalValue = portfolioData.reduce((s, p) => s + p.value, 0);
  const totalPnl = portfolioData.reduce((s, p) => s + p.pnl, 0);

  const donutData = portfolioData.map(p => ({ name: p.ticker, value: p.value }));

  return (
    <div className="panel flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="font-mono text-xs text-foreground font-medium">PORTFOLIO</span>
        <button onClick={() => setShowForm(!showForm)} className="text-primary hover:text-primary/80">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-2 border-b border-border space-y-1">
          <input
            value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })}
            placeholder="Ticker" className="w-full font-mono text-[10px] bg-secondary border border-border px-2 py-1 text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex gap-1">
            <input
              value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="Qty" type="number" className="w-1/2 font-mono text-[10px] bg-secondary border border-border px-2 py-1 text-foreground placeholder:text-muted-foreground"
            />
            <input
              value={form.avgPrice} onChange={e => setForm({ ...form, avgPrice: e.target.value })}
              placeholder="Avg $" type="number" step="0.01" className="w-1/2 font-mono text-[10px] bg-secondary border border-border px-2 py-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button type="submit" className="w-full font-mono text-[10px] bg-primary text-primary-foreground py-1 hover:bg-primary/90">ADD</button>
        </form>
      )}

      {positions.length > 0 && (
        <>
          <div className="px-3 py-2 border-b border-border">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-muted-foreground">Total Value</span>
              <span className="font-mono text-xs text-foreground">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-muted-foreground">P&L</span>
              <span className={`font-mono text-xs ${totalPnl >= 0 ? 'price-up' : 'price-down'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
          </div>

          {donutData.length > 0 && (
            <div className="h-24 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={20} outerRadius={35} dataKey="value" strokeWidth={0}>
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      <div className="flex-1 overflow-auto">
        {portfolioData.map(pos => (
          <div key={pos.id} className="flex items-center justify-between px-3 py-1.5 border-b border-border hover:bg-secondary/50 group">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-foreground font-medium">{pos.ticker}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{pos.quantity}x</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                ${pos.current.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-mono text-[10px] ${pos.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
              </div>
              <div className={`font-mono text-[10px] ${pos.pnlPct >= 0 ? 'price-up' : 'price-down'}`}>
                {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(1)}%
              </div>
            </div>
            <button onClick={() => removePosition(pos.id)} className="ml-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {positions.length === 0 && (
          <div className="px-3 py-6 text-center font-mono text-[10px] text-muted-foreground">
            No positions. Click + to add.
          </div>
        )}
      </div>
    </div>
  );
}
