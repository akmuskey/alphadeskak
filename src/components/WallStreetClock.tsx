import { useMarketHours } from '@/hooks/useMarketHours';

export default function WallStreetClock() {
  const { etTime } = useMarketHours();
  return (
    <div className="font-mono text-[10px] text-muted-foreground">
      {etTime}
    </div>
  );
}
