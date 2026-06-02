'use client'

interface LogoIconProps {
  className?: string
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="20" fill="url(#lg)" />
      <polygon points="50,18 88,42 50,66 12,42" fill="white" />
      <ellipse cx="50" cy="17" rx="5" ry="3" fill="rgba(255,255,255,0.85)" />
      <path d="M88,42 Q96,44 96,54" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="96" cy="58" r="4" fill="#fbbf24" />
      <path d="M33,52 L33,80 L50,86 L50,58 Z" fill="rgba(255,255,255,0.85)" />
      <path d="M67,52 L67,80 L50,86 L50,58 Z" fill="rgba(255,255,255,0.65)" />
      <line x1="50" y1="58" x2="50" y2="86" stroke="#059669" strokeWidth="2" />
    </svg>
  )
}
