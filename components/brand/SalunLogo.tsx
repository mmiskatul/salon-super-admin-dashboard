import React from 'react';

interface SalunLogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  theme?: 'light' | 'dark';
  textSize?: string;
}

export function SalunIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={className || 'shrink-0'}
    >
      <defs>
        <linearGradient id="salunSuperAdminGrad" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#938AFF" />
          <stop offset="100%" stopColor="#6054FF" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="28" fill="url(#salunSuperAdminGrad)" />
      <line
        x1="51"
        y1="18"
        x2="51"
        y2="65.5"
        stroke="#FFFFFF"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="51"
        y1="47"
        x2="72.5"
        y2="47"
        stroke="#FFFFFF"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="33"
        y1="47"
        x2="51"
        y2="47"
        stroke="#FFFFFF"
        strokeWidth="5.4"
        strokeLinejoin="round"
      />
      <circle cx="25.5" cy="47" r="7.5" stroke="#FFFFFF" strokeWidth="5.4" fill="none" />
      <circle cx="51" cy="73" r="7.5" stroke="#FFFFFF" strokeWidth="5.4" fill="none" />
    </svg>
  );
}

export default function SalunLogo({
  className = '',
  iconSize = 32,
  showText = true,
  theme = 'dark',
  textSize = 'text-[19px]',
}: SalunLogoProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <SalunIcon size={iconSize} />
      {showText && (
        <span
          className={`font-display ${textSize} leading-none font-extrabold tracking-[-0.02em] select-none`}
        >
          <span className={isDark ? 'text-white' : 'text-ink'}>Salun</span>
          <span className="text-[#635BFF]">BD</span>
        </span>
      )}
    </div>
  );
}
