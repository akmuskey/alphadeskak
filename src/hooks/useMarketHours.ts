import { useState, useEffect } from 'react';

export type MarketStatus = 'MARKET OPEN' | 'PRE-MARKET' | 'AFTER-HOURS' | 'MARKET CLOSED';

function getETTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function getMarketStatus(): MarketStatus {
  const now = getETTime();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  if (day === 0 || day === 6) return 'MARKET CLOSED';
  if (time >= 570 && time < 960) return 'MARKET OPEN'; // 9:30 - 16:00
  if (time >= 240 && time < 570) return 'PRE-MARKET';   // 4:00 - 9:30
  if (time >= 960 && time < 1200) return 'AFTER-HOURS';  // 16:00 - 20:00
  return 'MARKET CLOSED';
}

function formatETTime(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' ET';
}

export function useMarketHours() {
  const [status, setStatus] = useState<MarketStatus>(getMarketStatus);
  const [etTime, setEtTime] = useState(formatETTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
      setEtTime(formatETTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { status, etTime };
}
