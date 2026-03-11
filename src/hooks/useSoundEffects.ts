import { useCallback, useRef, useState } from 'react';

export function useSoundEffects() {
  const [enabled, setEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTick = useCallback((direction: 'up' | 'down') => {
    if (!enabled) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = direction === 'up' ? 880 : 440;
    osc.type = 'sine';
    gain.gain.value = 0.03;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [enabled]);

  return { enabled, setEnabled, playTick };
}
