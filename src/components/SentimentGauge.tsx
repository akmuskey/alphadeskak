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
  const [needleAngle, setNeedleAngle] = useState(-180);
  const prevScore = useRef(0);
  const initialMount = useRef(true);

  useEffect(() => {
    // Score 0 = -180deg (left), score 50 = -90deg (top), score 100 = 0deg (right)
    const targetAngle = -180 + (score / 100) * 180;
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

  return (
    <div className="panel flex flex-col" style={{ maxHeight: 220 }}>
      <div className="px-3 py-1.5 border-b border-border">
        <span className="font-mono text-xs text-foreground font-medium">MARKET SENTIMENT</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-2 py-1">
        <svg width="200" height="110" viewBox="0 0 200 110" className="w-full max-w-[200px]">
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="25%" stopColor="#ff9500" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="75%" stopColor="#00d395" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc track */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            stroke="rgba(123, 97, 255, 0.1)"
            strokeWidth="22"
            fill="none"
          />

          {/* Colored gradient arc */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            stroke="url(#arcGradient)"
            strokeWidth="20"
            fill="none"
            strokeLinecap="butt"
          />

          {/* Needle */}
          {(() => {
            // needleAngle: -180 (score 0, left) to 0 (score 100, right)
            const rad = (needleAngle * Math.PI) / 180;
            const len = 63; // 70% of radius 90
            const nx = 100 + len * Math.cos(rad);
            const ny = 100 + len * Math.sin(rad);
            return (
              <line
                x1="100" y1="100" x2={nx} y2={ny}
                stroke={zone.color}
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#needleGlow)"
                opacity={0.95}
              />
            );
          })()}

          {/* Center dot */}
          <circle cx="100" cy="100" r="5" fill={zone.color} opacity={0.9} />
          <circle cx="100" cy="100" r="2.5" fill="rgba(255,255,255,0.8)" />

          {/* Score text */}
          <text x="100" y="85" textAnchor="middle" fill="white" fontSize="22" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
            {displayScore}
          </text>

          {/* Label */}
          <text x="100" y="98" textAnchor="middle" fill={zone.color} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="500">
            {zone.label.toUpperCase()}
          </text>

          {/* Scale labels */}
          <text x="10" y="108" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'JetBrains Mono', monospace">0</text>
          <text x="190" y="108" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="'JetBrains Mono', monospace">100</text>
        </svg>

        {/* Legend row */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 px-1 pb-1.5" style={{ marginTop: -2 }}>
          {ZONES.map((z, i) => (
            <span key={i} className="font-mono whitespace-nowrap" style={{ fontSize: '9px', color: z.color, letterSpacing: '0.02em' }}>
              {z.short}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
