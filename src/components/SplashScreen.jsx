import React, { useEffect, useState, useRef } from 'react';

// SVG Bodhi Leaf Component with golden gradient
function BodhiLeaf({ style }) {
  return (
    <div className="absolute pointer-events-none animate-falling-leaf" style={style}>
      <svg
        width="24"
        height="28"
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
      >
        <path
          d="M50 5 C50 5 15 35 15 70 C15 95 32 110 50 110 C68 110 85 95 85 70 C85 35 50 5 50 5 Z M50 110 L50 120"
          fill="url(#leaf-gold-grad)"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <path d="M50 20 L50 100 M50 45 L30 35 M50 60 L25 50 M50 75 L30 68 M50 45 L70 35 M50 60 L75 50 M50 75 L70 68" stroke="#d97706" strokeWidth="1.5" opacity="0.7" />
        <defs>
          <linearGradient id="leaf-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Pre-generate leaves once at module level so they're ready instantly
const LEAVES = Array.from({ length: 25 }).map((_, idx) => ({
  id: idx,
  left: `${(idx * 4.1 + 2) % 100}%`,
  animationDuration: `${3.5 + (idx % 5) * 0.8}s`,
  animationDelay: `${(idx % 8) * 0.3}s`,
  size: `${16 + (idx % 5) * 4}px`,
  opacity: 0.4 + (idx % 3) * 0.2,
  rotation: `${(idx * 37) % 360}deg`
}));

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Auto dismiss after 2.5s
    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 500);
    }, 2500);
    return () => clearTimeout(timerRef.current);
  }, [onFinish]);

  const handleSkip = () => {
    clearTimeout(timerRef.current);
    setIsFadingOut(true);
    setTimeout(onFinish, 300);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 overflow-hidden select-none cursor-pointer font-kantumruy transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      {/* Falling Bodhi Leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {LEAVES.map((leaf) => (
          <BodhiLeaf
            key={leaf.id}
            style={{
              left: leaf.left,
              top: '-40px',
              width: leaf.size,
              height: leaf.size,
              animationDuration: leaf.animationDuration,
              animationDelay: leaf.animationDelay,
              opacity: leaf.opacity,
              transform: `rotate(${leaf.rotation})`
            }}
          />
        ))}
      </div>

      {/* Top Spacer */}
      <div className="h-10"></div>

      {/* Logo — show immediately, no waiting */}
      <div className="flex flex-col items-center justify-center gap-4 z-10">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center filter drop-shadow-[0_10px_30px_rgba(245,158,11,0.5)]">
          {/* Pulsing outer ring */}
          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping"></div>
          {/* Logo — preloaded by index.html so shows immediately */}
          <img
            src="/app_logo.png"
            alt="ចាប់ស្លាកលេខ"
            className="w-full h-full object-contain rounded-full animate-float"
            fetchpriority="high"
            decoding="async"
          />
        </div>
      </div>

      {/* Bottom Title */}
      <div className="flex flex-col items-center gap-2 z-10 mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-amber-300 font-moul tracking-wide text-center">
          ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
        </h1>
        <p className="text-xs text-amber-500/80 font-kantumruy flex items-center gap-2">
          <span>🍃 ដើមពោធិ៍ត្រជាក់ត្រជុំ</span>
          <span>•</span>
          <span>ចុចដើម្បីរំលង</span>
        </p>
      </div>
    </div>
  );
}
