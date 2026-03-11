import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SHORTCUTS = [
  { key: '/', desc: 'Focus search bar' },
  { key: '?', desc: 'Show keyboard shortcuts' },
  { key: 'Esc', desc: 'Close dialogs / blur search' },
  { key: '1-5', desc: 'Switch timeframe (1D, 1W, 1M, 3M, 1Y)' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="font-mono max-w-sm border-border" style={{ background: 'rgba(19, 20, 43, 0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(123, 97, 255, 0.2)', borderRadius: '12px' }}>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm text-foreground tracking-wider">KEYBOARD SHORTCUTS</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between py-1 border-b border-border">
              <kbd className="text-xs bg-secondary px-2 py-0.5 text-primary border border-border rounded-md">{s.key}</kbd>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
