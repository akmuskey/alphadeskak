import { useEffect, useRef, useState } from 'react';

interface SentimentGaugeProps {
  score: number;
}

const ZONES = [
  { min: 0, max: 25, label: 'Extreme Fear', short: 'Ext Fear', color: '#ff4d6d' },
  { min: 25, max: 50, label: 'Fear', short: 'Fear', color: '#ff9500' },
  { min: 50, max: 55, label: 'Neutral', short: 'Neutral', color: '#ffd700' },
  { min: 55, max: 75, label: 'Greed', short: 'Greed', color: '#00d395' },
  { min: 75, max: 100, label: 'Extreme Greed', short: 'Ext Greed', color: '#00d4ff' },
];

function getZone(score: number) {
  return ZONES.find(z => score <= z.max) || ZONES[ZONES.length - 1];
}

export default function SentimentGauge({ score }: SentimentGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [needleAngle, setNeedleAngle] = useState(-90);
  const prevScore = useRef(0);
  const initialMount = useRef(true);

  useEffect(() => {
    const targetAngle = -90 + (score / 100) * 180;
    const duration = initialMount.current ? 1500 : 500;
    initialMount.current = false;

    requestAnimationFrame(() => setNeedleAngle(targetAngle));

    const start = prevScore.current;
    const diff = score - start;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    prevScore.current = score;
  }, [score]);

  const zone = getZone(score);
  const transitionDuration = initialMount.current ? '1.5s' : '0.5s';

  const cx = 100, cy = 85, r = 70;

  // Build colored arc segments with updated zone ranges
  const arcSegments = ZONES.map((z, i) => {
    const startAngle = -90 + (z.min / 100) * 180;
    const endAngle = -90 + (z.max / 100) * 180;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        stroke={z.color}
        strokeWidth="7"
        fill="none"
        strokeLinecap="butt"
        opacity={1}
      />
    );
  });

  return (
    <div className="panel flex flex-col" style={{ maxHeight: 220 }}>
      <div className="px-3 py-1.5 border-b border-border">
        <span className="font-mono text-xs text-foreground font-medium">MARKET SENTIMENT</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-2 py-1">
        <svg width="200" height="110" viewBox="0 0 200 110" className="w-full max-w-[200px]">
          {/* Background arc track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            stroke="rgba(123, 97, 255, 0.1)"
            strokeWidth="9"
            fill="none"
          />

          {/* Colored segments */}
          {arcSegments}

          {/* Needle - pointed triangle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: `transform ${transitionDuration} cubic-bezier(0.34, 1.56, 0.64, 1)`,
            }}
          >
            <polygon
              points={`${cx},${cy - r + 14} ${cx - 3},${cy} ${cx + 3},${cy}`}
              fill={zone.color}
              filter="url(#needleGlow)"
              opacity={0.95}
            />
          </g>

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="4.5" fill={zone.color} opacity={0.9} />
          <circle cx={cx} cy={cy} r="2" fill="rgba(19,20,43,0.9)" />

          {/* Score text */}
          <text
            x={cx}
            y={cy - 18}
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="600"
          >
            {displayScore}
          </text>

          {/* Label */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fill={zone.color}
            fontSize="8"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="500"
          >
            {zone.label.toUpperCase()}
          </text>

          {/* Scale labels */}
          <text x={cx - r - 2} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'JetBrains Mono', monospace">0</text>
          <text x={cx + r + 2} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'JetBrains Mono', monospace">100</text>

          {/* Glow filter */}
          <defs>
            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Legend row */}
        <div className="flex items-center justify-center gap-1.5 px-1 pb-1" style={{ marginTop: -2 }}>
          {ZONES.map((z, i) => (
            <span key={i} className="font-mono whitespace-nowrap" style={{ fontSize: '7px', color: z.color, opacity: 0.85 }}>
              {z.short}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
