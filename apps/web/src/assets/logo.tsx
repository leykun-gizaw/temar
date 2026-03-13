import React from 'react';

export interface LogoProps {
  size?: number | string;
  className?: string;
  title?: string;
  accentColorVar?: string;
}

export default function Logo({
  size = 32,
  className = '',
  title = 'Temar Logo',
  accentColorVar = '--primary',
}: LogoProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const accent = `var(${accentColorVar})`;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      {/* Background Card (Oldest Memory) - Fanned wide left */}
      <rect
        x="8"
        y="3"
        width="12"
        height="15"
        rx="3"
        fill="currentColor"
        opacity="0.3"
        transform="rotate(-24 8 18)"
      />

      {/* Middle Card (Reviewing) - Fanned slightly left */}
      <rect
        x="8"
        y="3"
        width="12"
        height="15"
        rx="3"
        fill="currentColor"
        opacity="0.6"
        transform="rotate(-12 8 18)"
      />

      {/* Front Card (Active Recall) - Straight and clear */}
      <g>
        {/* Solid body of the front card */}
        <rect
          x="8"
          y="3"
          width="12"
          height="15"
          rx="3"
          fill="currentColor"
          stroke={accent}
          strokeWidth="1.5"
        />
        {/* Abstract note lines - Cutout effect using the accent color */}
        <path
          d="M11 7.5H15M11 11H13.5"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
