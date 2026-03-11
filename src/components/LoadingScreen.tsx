import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()+=<>?/|{}[]~';
const MESSAGES = [
  'Connecting to market feeds...',
  'Initializing price engine...',
  'Loading historical data...',
  'Calibrating order book...',
  'Syncing portfolio state...',
  'System ready.',
];

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(13, 14, 26, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(123, 97, 255, 0.35)';
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (msgIndex < MESSAGES.length - 1) {
      const t = setTimeout(() => setMsgIndex(i => i + 1), 500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [msgIndex, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#0d0e1a' }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 text-center">
        <h1 className="font-mono text-2xl tracking-[0.4em] mb-8 font-bold text-gradient-purple">
          A L P H A D E S K
        </h1>
        <div className="font-mono text-sm text-muted-foreground space-y-1">
          {MESSAGES.slice(0, msgIndex + 1).map((msg, i) => (
            <div key={i} className={i === msgIndex ? 'text-primary' : 'text-muted-foreground'}>
              <span className="text-primary mr-2">{'>'}</span>{msg}
            </div>
          ))}
        </div>
        <div className="mt-6 w-64 h-px mx-auto overflow-hidden" style={{ background: 'rgba(123, 97, 255, 0.2)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${((msgIndex + 1) / MESSAGES.length) * 100}%`, background: 'linear-gradient(135deg, #7b61ff, #00d4ff)' }}
          />
        </div>
      </div>
    </div>
  );
}
