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
          className={`font-mono text-xs px-2.5 py-1 border transition-colors ${
            selected === tf
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
