import { Timeframe, TIMEFRAMES } from '@/lib/constants';

interface TimeframeSelectorProps {
  selected: Timeframe;
  onChange: (tf: Timeframe) => void;
}

export default function TimeframeSelector({ selected, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`font-mono text-xs px-2.5 py-1 border transition-all ${
            selected === tf
              ? 'active-pill border-transparent text-white'
              : 'bg-secondary text-muted-foreground border-border hover:text-foreground hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] rounded-lg'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
