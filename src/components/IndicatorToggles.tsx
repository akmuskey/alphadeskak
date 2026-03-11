interface IndicatorTogglesProps {
  sma20: boolean;
  sma50: boolean;
  bollinger: boolean;
  onToggle: (key: 'sma20' | 'sma50' | 'bollinger') => void;
}

export default function IndicatorToggles({ sma20, sma50, bollinger, onToggle }: IndicatorTogglesProps) {
  const items = [
    { key: 'sma20' as const, label: 'SMA 20', active: sma20, color: '#7b61ff' },
    { key: 'sma50' as const, label: 'SMA 50', active: sma50, color: '#00d4ff' },
    { key: 'bollinger' as const, label: 'BB', active: bollinger, color: '#7b61ff' },
  ];

  return (
    <div className="flex gap-1">
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onToggle(item.key)}
          className={`font-mono text-xs px-2.5 py-1 border transition-all rounded-lg ${
            item.active
              ? 'border-border text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] bg-secondary'
          }`}
          style={item.active ? { borderColor: item.color, color: item.color } : {}}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
