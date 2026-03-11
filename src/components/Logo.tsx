export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-4">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7b61ff" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </defs>
        <polygon points="12,2 22,20 2,20" fill="url(#logoGrad)" opacity="0.8" />
        <polygon points="12,8 18,20 6,20" fill="#0d0e1a" />
        <polygon points="12,12 16,20 8,20" fill="url(#logoGrad)" opacity="0.6" />
      </svg>
      <span className="font-mono text-xs tracking-[0.35em] font-medium" style={{ background: 'linear-gradient(135deg, #7b61ff, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent' }}>
        ALPHADESK
      </span>
    </div>
  );
}
