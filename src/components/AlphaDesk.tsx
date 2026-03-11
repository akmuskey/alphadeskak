import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSimulatedPrices } from '@/hooks/useSimulatedPrices';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { SEED_PRICES } from '@/lib/constants';
import Logo from './Logo';
import SearchBar from './SearchBar';
import WallStreetClock from './WallStreetClock';
import TickerBar from './TickerBar';
import CandlestickChart from './CandlestickChart';
import OrderBook from './OrderBook';
import PortfolioTracker from './PortfolioTracker';
import MarketMovers from './MarketMovers';
import StatusBar from './StatusBar';
import KeyboardShortcuts from './KeyboardShortcuts';

export default function AlphaDesk() {
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const { prices, flashMap } = useSimulatedPrices();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useSoundEffects();

  const handleSearch = useCallback((ticker: string) => {
    if (SEED_PRICES[ticker] || ticker.match(/^[A-Z]{1,5}(-[A-Z]{2,4})?$/)) {
      setSelectedTicker(ticker);
    } else {
      toast.error(`Invalid ticker: ${ticker}`, {
        style: { background: '#111118', border: '1px solid hsl(0, 100%, 60%)', color: '#ff3b3b', fontFamily: 'JetBrains Mono' },
      });
    }
  }, []);

  const handleSelectTicker = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden relative">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Top bar: logo + search + clock */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-card h-10 shrink-0">
        <Logo />
        <SearchBar onSearch={handleSearch} currentTicker={selectedTicker} />
        <WallStreetClock />
      </div>

      {/* Ticker bar */}
      <TickerBar prices={prices} flashMap={flashMap} onSelect={handleSelectTicker} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar */}
        <div className="w-[260px] shrink-0 flex flex-col border-r border-border">
          <div className="flex-1 min-h-0">
            <PortfolioTracker prices={prices} />
          </div>
          <div className="flex-1 min-h-0 border-t border-border">
            <MarketMovers prices={prices} onSelect={handleSelectTicker} />
          </div>
        </div>

        {/* Center chart */}
        <div className="flex-1 min-w-0">
          <CandlestickChart ticker={selectedTicker} />
        </div>

        {/* Right sidebar */}
        <div className="w-[280px] shrink-0 border-l border-border">
          <OrderBook ticker={selectedTicker} price={prices[selectedTicker]} />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar soundEnabled={soundEnabled} onSoundToggle={() => setSoundEnabled(!soundEnabled)} />

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcuts />
    </div>
  );
}
