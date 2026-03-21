import React from 'react';

export interface LogoProps {
  size?: number | string;
  className?: string;
  title?: string;
}

export default function Logo({
  size = 38,
  className = '',
  title = 'Temar Logo',
}: LogoProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id="temar-logo-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="20"
        fill="url(#temar-logo-grad)"
      />
      <g transform="rotate(45,50,50) translate(-2,5.5)">
        <rect x="40" y="24" width="20" height="32" rx="4" fill="#fff" />
        <polygon points="42,58 58,58 50,72" fill="rgba(255,255,255,0.9)" />
        <circle cx="50" cy="74" r="3" fill="#fff" opacity="0.9" />
        <circle cx="50" cy="74" r="6" fill="#fff" opacity="0.25" />
        <circle cx="50" cy="74" r="10" fill="#fff" opacity="0.08" />
        <rect
          x="39"
          y="17"
          width="22"
          height="6"
          rx="3"
          fill="rgba(255,255,255,0.65)"
        />
        <rect
          x="61"
          y="18"
          width="4"
          height="24"
          rx="2"
          fill="rgba(255,255,255,0.55)"
        />
      </g>
    </svg>
  );
}
