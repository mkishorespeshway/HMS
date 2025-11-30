import React from "react";

export default function Logo({ size = 24 }) {
  const s = Number(size) || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#0FD3FF" />
          <stop offset="60%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0A5FD1" />
        </radialGradient>
        <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A7F7FF" />
          <stop offset="100%" stopColor="#34E7FF" />
        </linearGradient>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="12" fill="url(#bg)" />
      <g filter="url(#glow)">
        <rect x="28" y="20" width="8" height="24" rx="4" fill="url(#cyan)" />
        <rect x="20" y="28" width="24" height="8" rx="4" fill="url(#cyan)" />
        <path d="M20 28 A12 12 0 0 1 44 28" fill="none" stroke="url(#cyan)" strokeWidth="6" strokeLinecap="round" />
        <rect x="13" y="26" width="12" height="12" rx="3" fill="url(#cyan)" />
        <rect x="39" y="26" width="12" height="12" rx="3" fill="url(#cyan)" />
        <path d="M49 38 L57 44" stroke="url(#cyan)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="58" cy="46" r="3" fill="url(#cyan)" />
      </g>
    </svg>
  );
}
