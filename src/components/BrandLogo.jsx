import React from 'react';

const BrandLogo = ({ subtitle = '', compact = false }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 shadow-sm ring-1 ring-emerald-100">
      <svg
        viewBox="0 0 64 64"
        className="h-11 w-11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brandMarkGradient" x1="10" y1="8" x2="52" y2="56">
            <stop stopColor="#D1FAE5" />
            <stop offset="0.55" stopColor="#A7F3D0" />
            <stop offset="1" stopColor="#ECFDF5" />
          </linearGradient>
        </defs>
        <path
          d="M43.5 9.5 52 15h-6.3l.7 6.3-3.4-4.1-10.8-5.7 11.3-2Z"
          fill="url(#brandMarkGradient)"
          opacity="0.95"
        />
        <path
          d="M18.8 16.3c2.8-2.6 6.8-4 11.3-4 4.1 0 7.7 1 11 2.8l-2.8 4.6c-2.5-1.4-5-2-8-2-3.4 0-6 1-7.9 2.8-1.6 1.5-2.5 3.3-2.5 5.4 0 2.8 1.6 4.9 4.7 6.2 1.1.5 2.8 1 5.1 1.5 2.2.5 4.1 1.1 5.7 1.7 5.6 2.1 8.4 5.8 8.4 11.1 0 4.1-1.5 7.4-4.4 9.8-2.9 2.4-6.9 3.6-11.9 3.6-5.8 0-10.6-1.8-14.4-5.3l3.4-4.3c3.2 2.9 6.9 4.4 11.2 4.4 3.3 0 6-.8 8-2.4 1.9-1.5 2.9-3.4 2.9-5.8 0-2.6-1.4-4.5-4.2-5.8-1.4-.6-3.5-1.2-6.4-1.9-2.9-.7-5.2-1.5-6.9-2.3-4.2-2-6.3-5.3-6.3-10 0-4 1.4-7.2 4.3-9.9Z"
          fill="url(#brandMarkGradient)"
        />
        <circle cx="23.4" cy="24.4" r="3.2" fill="#ECFDF5" />
        <circle cx="40.9" cy="27.2" r="3.2" fill="#ECFDF5" />
        <path
          d="M20.9 29.4h5l2.1 8.8-5.3 6.5-4.4-1.7 2.6-13.6ZM38.8 31.3h4.8l2.2 12.2-4.2 1.3-5.4-6.4 2.6-7.1Z"
          fill="#D1FAE5"
          opacity="0.95"
        />
        <path
          d="m29.2 36.2 2.9 2 3-1 1.9 1.9-2.3 2.3h-3.5l-2.7-2.5.7-2.7Z"
          fill="#ECFDF5"
        />
      </svg>
    </div>
    <div className={compact ? 'leading-tight' : undefined}>
      <h1 className="text-xl font-semibold text-slate-900">SmartHire</h1>
      {subtitle ? (
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  </div>
);

export default BrandLogo;
