interface IndicatorTogglesProps {
  sma20: boolean;
  sma50: boolean;
  bollinger: boolean;
  onToggle: (key: 'sma20' | 'sma50' | 'bollinger') => void;
}

export default function IndicatorToggles({ sma20, sma50, bollinger, onToggle }: IndicatorTogglesProps) {
  const items = [
    { key: 'sma20' as const, label: 'SMA 20', active: sma20, color: 'hsl(155, 100%, 50%)' },
    { key: 'sma50' as const, label: 'SMA 50', active: sma50, color: 'hsl(45, 100%, 60%)' },
    { key: 'bollinger' as const, label: 'BB', active: bollinger, color: 'hsl(210, 100%, 60%)' },
  ];

  return (
    <div className="flex gap-1">
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onToggle(item.key)}
          className={`font-mono text-xs px-2.5 py-1 border transition-colors ${
            item.active
              ? 'border-border text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground bg-secondary'
          }`}
          style={item.active ? { borderColor: item.color, color: item.color } : {}}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
