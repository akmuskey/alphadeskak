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
        style: { background: 'rgba(19, 20, 43, 0.9)', border: '1px solid rgba(123, 97, 255, 0.3)', color: '#ff4d6d', fontFamily: 'JetBrains Mono' },
      });
    }
  }, []);

  const handleSelectTicker = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Aurora background */}
      <div className="aurora-bg" />
      {/* Dot grid overlay */}
      <div className="dot-grid-overlay" />
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border" style={{ background: 'rgba(19, 20, 43, 0.8)', backdropFilter: 'blur(20px)' }}>
          <Logo />
          <SearchBar onSearch={handleSearch} currentTicker={selectedTicker} />
          <WallStreetClock />
        </div>

        {/* Ticker bar */}
        <TickerBar prices={prices} flashMap={flashMap} onSelect={handleSelectTicker} />

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden min-h-0 gap-2 p-2">
          {/* Left sidebar */}
          <div className="w-[260px] shrink-0 flex flex-col gap-2">
            <div className="flex-1 min-h-0">
              <PortfolioTracker prices={prices} />
            </div>
            <div className="flex-1 min-h-0">
              <MarketMovers prices={prices} onSelect={handleSelectTicker} />
            </div>
          </div>

          {/* Center chart */}
          <div className="flex-1 min-w-0">
            <CandlestickChart ticker={selectedTicker} />
          </div>

          {/* Right sidebar */}
          <div className="w-[280px] shrink-0">
            <OrderBook ticker={selectedTicker} price={prices[selectedTicker]} />
          </div>
        </div>

        {/* Status bar */}
        <StatusBar soundEnabled={soundEnabled} onSoundToggle={() => setSoundEnabled(!soundEnabled)} />
      </div>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcuts />
    </div>
  );
}
