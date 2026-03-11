import { useState, useEffect } from 'react';
import { useMarketHours } from '@/hooks/useMarketHours';
import { Volume2, VolumeX } from 'lucide-react';

interface StatusBarProps {
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export default function StatusBar({ soundEnabled, onSoundToggle }: StatusBarProps) {
  const { status } = useMarketHours();
  const [latency, setLatency] = useState(47);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => {
      setLatency(Math.floor(Math.random() * 100) + 20);
      setLastUpdated(new Date());
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const statusColor = status === 'MARKET OPEN' ? 'price-up' : status === 'PRE-MARKET' || status === 'AFTER-HOURS' ? 'text-terminal-yellow' : 'text-muted-foreground';

  return (
    <div className="w-full h-7 flex items-center justify-between px-4 font-mono text-[10px]" style={{ background: 'rgba(13, 14, 26, 0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(123, 97, 255, 0.2)' }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-glow" style={{ boxShadow: '0 0 10px #7b61ff' }} />
          <span className="text-primary">LIVE</span>
        </div>
        <span className="text-muted-foreground">
          {lastUpdated.toLocaleTimeString('en-US', { hour12: false })}
        </span>
        <span className={statusColor}>{status}</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">Feed: <span className="text-foreground">{latency}μs</span></span>
        <button onClick={onSoundToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
        </button>
        <span className="text-muted-foreground">v1.0.0</span>
      </div>
    </div>
  );
}
