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
import SentimentGauge from './SentimentGauge';
import StatusBar from './StatusBar';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useSentimentScore } from '@/hooks/useSentimentScore';

export default function AlphaDesk() {
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const { prices, flashMap } = useSimulatedPrices();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useSoundEffects();
  const sentimentScore = useSentimentScore(prices);

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
    <div className="h-screen w-screen flex flex-col overflow-hidden relative max-w-full">
      {/* Aurora background - animated purple/cyan blobs */}
      <div className="aurora-bg" />
      {/* Dot grid overlay */}
      <div className="dot-grid-overlay" />
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border gap-2" style={{ background: 'rgba(19, 20, 43, 0.8)', backdropFilter: 'blur(20px)' }}>
          <Logo />
          <div className="flex-1 min-w-0 hidden md:block">
            <SearchBar onSearch={handleSearch} currentTicker={selectedTicker} />
          </div>
          <WallStreetClock />
        </div>
        {/* Mobile search bar */}
        <div className="md:hidden px-2 py-1 border-b border-border" style={{ background: 'rgba(19, 20, 43, 0.8)' }}>
          <SearchBar onSearch={handleSearch} currentTicker={selectedTicker} />
        </div>

        {/* Ticker bar */}
        <TickerBar prices={prices} flashMap={flashMap} onSelect={handleSelectTicker} />

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden min-h-0 gap-2 p-2 md:flex-row flex-col md:overflow-hidden overflow-y-auto mobile-scroll">
          {/* Center chart - first on mobile */}
          <div className="flex-1 min-w-0 md:order-none order-1 min-h-[350px] md:min-h-0">
            <CandlestickChart ticker={selectedTicker} />
          </div>

          {/* Left sidebar - reordered on mobile */}
          <div className="md:w-[260px] w-full md:shrink-0 flex md:flex-col flex-col gap-2 md:order-first order-3">
            <div className="md:flex-1 min-h-0 order-2">
              <PortfolioTracker prices={prices} />
            </div>
            <div className="md:flex-1 min-h-0 order-1">
              <MarketMovers prices={prices} onSelect={handleSelectTicker} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="md:w-[280px] w-full md:shrink-0 order-2">
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
