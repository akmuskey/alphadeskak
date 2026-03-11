export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-4">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
        <polygon points="12,2 22,20 2,20" fill="currentColor" opacity="0.8" />
        <polygon points="12,8 18,20 6,20" fill="hsl(240, 15%, 7%)" />
        <polygon points="12,12 16,20 8,20" fill="currentColor" opacity="0.6" />
      </svg>
      <span className="font-mono text-xs tracking-[0.35em] text-foreground font-medium">
        ALPHADESK
      </span>
    </div>
  );
}
