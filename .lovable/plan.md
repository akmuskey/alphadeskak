

# AlphaDesk — Enhanced Trading Terminal Plan

## Summary
Build the full AlphaDesk terminal as previously planned, plus all the production-grade enhancements listed below. This is a single comprehensive implementation plan.

## Architecture

### File Structure
```
src/
├── components/
│   ├── AlphaDesk.tsx              # Main layout shell
│   ├── LoadingScreen.tsx          # Matrix-style boot animation
│   ├── TickerBar.tsx              # Scrolling ticker with sparklines
│   ├── SearchBar.tsx              # Ticker search with "/" shortcut
│   ├── CandlestickChart.tsx       # TradingView Lightweight Charts
│   ├── IndicatorToggles.tsx       # SMA/Bollinger toggle buttons
│   ├── TimeframeSelector.tsx      # 1D/1W/1M/3M/1Y
│   ├── OrderBook.tsx              # Simulated bid/ask with SIM badge
│   ├── PortfolioTracker.tsx       # Positions + mini donut chart
│   ├── MarketMovers.tsx           # Gainers/losers with sparklines
│   ├── StatusBar.tsx              # LIVE dot, latency, version, market status
│   ├── WallStreetClock.tsx        # EST clock top-right
│   ├── KeyboardShortcuts.tsx      # "?" modal showing all shortcuts
│   ├── Logo.tsx                   # Geometric bull + ALPHADESK
│   └── SoundToggle.tsx            # Tick sound on/off
├── hooks/
│   ├── useSimulatedPrices.ts      # Random walk price simulation
│   ├── useHistoricalData.ts       # Fetch real OHLCV from free API
│   ├── usePortfolio.ts            # localStorage CRUD for positions
│   ├── useMarketHours.ts          # NYSE open/close/pre/after logic
│   └── useSoundEffects.ts         # Audio tick on price change
├── lib/
│   ├── marketData.ts              # API calls, data transforms
│   ├── indicators.ts              # SMA, Bollinger Band calculations
│   ├── sentiment.ts               # (stub for future news)
│   └── constants.ts               # Ticker lists, colors, config
├── pages/
│   └── Index.tsx                  # Entry: loading screen → AlphaDesk
```

### Dependencies to Add
- `lightweight-charts` (TradingView charting)
- No other new deps needed — recharts already available for sparklines/donut

## Design System Updates (index.css)

- Override CSS variables for dark terminal theme: `--background: #0a0a0f`, `--card: #111118`, etc.
- Add `--terminal-green: #00ff9d`, `--terminal-red: #ff3b3b`
- Import JetBrains Mono from Google Fonts in `index.html`
- Add scanline/noise texture overlay via CSS `::after` pseudo-element on body
- Add `.panel` utility class with sharp corners, 1px `#1e1e2e` border, hover glow
- Add `.price-flash-green` and `.price-flash-red` keyframe animations (brief background flash)
- Add pulsing glow keyframe for LIVE dot

## Core Features

### 1. Loading Screen
- Full-screen dark background with matrix-style falling green characters (canvas or CSS animation)
- "ALPHADESK INITIALIZING..." text with typewriter effect
- Progress bar or sequential status messages ("Connecting to feeds...", "Loading market data...")
- Auto-transitions to dashboard after ~3 seconds or when data is ready

### 2. Live Ticker Bar
- Horizontal scrolling bar, CSS marquee animation
- Each ticker: symbol, price, % change (green/red), **mini sparkline** (last 24 data points via recharts `<Sparkline>` or inline SVG)
- Prices update via `useSimulatedPrices` every 2-3s with random walk seeded from real last price
- Price flash animation on each update

### 3. Candlestick Chart
- TradingView `lightweight-charts` `createChart()` with dark theme config
- Fetch real OHLCV from free proxy (e.g., Yahoo Finance via a CORS proxy or Alpha Vantage demo key)
- Timeframe switcher: 1D, 1W, 1M, 3M, 1Y
- Volume histogram series below
- Crosshair with OHLCV tooltip
- Grid background with subtle `#1e1e2e` lines

### 4. Technical Indicators
- Toggle buttons: 20 SMA, 50 SMA, Bollinger Bands
- Calculated in `indicators.ts`, rendered as `addLineSeries()` overlays
- Green/yellow/blue line colors

### 5. Order Book
- **"SIM" badge** top-right of panel
- Generate 15 bid/ask levels around current simulated price
- Green bars (bids) / red bars (asks) with size proportional width
- Spread shown in center
- Re-generated on each price tick with slight randomization

### 6. Portfolio Tracker
- Form: ticker, qty, avg price → saved to localStorage
- Table rows: ticker, qty, avg, current, P&L ($, %), live-updating
- **Mini donut chart** (recharts PieChart) showing allocation percentages
- Total portfolio value + daily change at top

### 7. Market Movers
- 20-stock watchlist, simulated prices
- Sort by % change, show top 5 gainers / 5 losers
- Each row: ticker, % change, **mini sparkline**
- Click loads ticker in main chart
- Refreshes every 30s

### 8. Search Bar
- Top center, monospace input
- "/" keyboard shortcut to focus
- On submit: update chart, order book, selected ticker state
- Invalid ticker → red toast via sonner

## Production Enhancements

### Visual
- **Scanline overlay**: CSS `::after` on `#root` with repeating-linear-gradient (horizontal lines, low opacity)
- **Panel hover glow**: `box-shadow: 0 0 20px rgba(0,255,157,0.05)` on hover transition
- **Price flash**: `.flash-green { animation: flashGreen 0.4s }` — brief green/red background highlight on value change
- **Pulsing LIVE dot**: Keyframe animation with `box-shadow` glow expanding/contracting

### Loading Screen
- Canvas-based matrix rain effect (falling random chars in terminal green)
- "ALPHADESK INITIALIZING..." centered with typewriter CSS animation
- Fades out after initial data fetch completes

### Professional Details
- **Keyboard shortcuts modal** ("?" to open): lists "/", "?", Esc, number keys for timeframes
- **Market hours indicator**: `useMarketHours` hook checks current time vs NYSE schedule (9:30-16:00 ET, M-F). Shows "MARKET OPEN", "PRE-MARKET" (4:00-9:30), "AFTER-HOURS" (16:00-20:00), or "MARKET CLOSED"
- **EST clock**: Top-right, updates every second, formatted `HH:MM:SS ET`
- **Sound effects**: Tiny tick sound (generated via Web Audio API oscillator, no external files). Off by default, toggle in status bar

### Credibility
- **Logo**: Simple geometric bull SVG (triangle-based) + "A L P H A D E S K" in letter-spaced capitals, top-left
- **SIM badge**: Small outlined badge on order book header
- **Version**: "v1.0.0" in status bar
- **Latency indicator**: Status bar shows simulated latency like "Feed: 47μs" that fluctuates randomly between 20-120μs every second

## Layout Implementation
- CSS Grid: `grid-template-columns: 280px 1fr 300px`, `grid-template-rows: 40px 1fr 28px`
- Ticker bar spans full width top row
- Status bar spans full width bottom row
- All panels use the `.panel` class (dark bg, sharp corners, thin border, hover glow)
- Responsive: on smaller screens, sidebars collapse to tabs below chart

## Data Flow
1. On mount: fetch real historical OHLCV for default ticker (AAPL) + seed initial prices for all tickers
2. `useSimulatedPrices`: `setInterval` every 2-3s, applies random walk to all tracked tickers, broadcasts via React context
3. Chart reads from fetched historical data; overlays get recalculated on timeframe/indicator change
4. Portfolio reads current prices from context, computes P&L
5. Market movers sorts context prices by % change from open

