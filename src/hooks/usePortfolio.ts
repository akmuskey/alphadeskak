import { useState, useEffect, useCallback } from 'react';
import { PortfolioPosition } from '@/lib/constants';

const STORAGE_KEY = 'alphadesk_portfolio';

function loadPositions(): PortfolioPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function usePortfolio() {
  const [positions, setPositions] = useState<PortfolioPosition[]>(loadPositions);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  const addPosition = useCallback((ticker: string, quantity: number, avgPrice: number) => {
    setPositions(prev => [
      ...prev,
      { id: crypto.randomUUID(), ticker: ticker.toUpperCase(), quantity, avgPrice },
    ]);
  }, []);

  const removePosition = useCallback((id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  return { positions, addPosition, removePosition };
}
