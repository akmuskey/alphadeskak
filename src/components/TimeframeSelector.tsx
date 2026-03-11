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
              ? 'text-white font-medium shadow-[0_0_15px_rgba(123,97,255,0.5)]'
              : 'bg-secondary text-muted-foreground border-border hover:text-foreground hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] rounded-lg'
          }`}
          style={selected === tf ? { background: 'linear-gradient(135deg, #7b61ff, #00d4ff)', borderColor: 'transparent', borderRadius: '999px' } : {}}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
