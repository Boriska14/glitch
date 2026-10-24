/** Motifs graphiques originaux inspirés de l'imagerie du moodboard (soleil, peigne, cauri, zigzag). Décoratifs : aria-hidden. */
type P = { className?: string };

export function Sun({ className }: P) {
  const rays = Array.from({ length: 20 }, (_, i) => {
    const a = (i * 360) / 20, long = i % 2 === 0;
    return <line key={i} x1="0" y1={-38} x2="0" y2={long ? -60 : -50} transform={`rotate(${a})`} strokeWidth={long ? 3.5 : 2.5} strokeLinecap="round" />;
  });
  return (
    <svg viewBox="-64 -64 128 128" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle r="14" fill="currentColor" stroke="none" />
      <circle r="26" strokeWidth="3" />
      <circle r="32" strokeWidth="1.5" strokeDasharray="2 5" />
      {rays}
    </svg>
  );
}

export function Comb({ className }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={13 + i * 17} y="8" width="9" height="58" rx="4.5" />)}
      <rect x="6" y="60" width="88" height="16" rx="8" />
      <circle cx="26" cy="68" r="3" fill="var(--tile, #0c0a09)" /><circle cx="50" cy="68" r="3" fill="var(--tile, #0c0a09)" /><circle cx="74" cy="68" r="3" fill="var(--tile, #0c0a09)" />
      <rect x="44" y="80" width="12" height="16" rx="6" />
    </svg>
  );
}

export function Cowrie({ className }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinecap="round">
      <ellipse cx="50" cy="50" rx="27" ry="40" strokeWidth="4" transform="rotate(18 50 50)" />
      <path d="M44 20 C 58 40, 42 60, 56 80" strokeWidth="4" />
      {[26, 34, 42, 50, 58, 66, 74].map((y, i) => <g key={y}><line x1={44 + (i % 3) * 2 - 14} y1={y} x2={44 + (i % 3) * 2 - 6} y2={y + 2} strokeWidth="2.5" /><line x1={58 + (i % 2) * 2 + 4} y1={y + 2} x2={58 + (i % 2) * 2 + 12} y2={y} strokeWidth="2.5" /></g>)}
    </svg>
  );
}

export function Triangles({ className }: P) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden fill="currentColor" preserveAspectRatio="none">
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 15} 60 L${i * 15 + 7.5} 8 L${i * 15 + 15} 60 Z`} />)}
    </svg>
  );
}
