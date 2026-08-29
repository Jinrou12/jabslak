import React, { useEffect, useState, useRef } from 'react';

// ===========================
// Heart-Shaped Golden Bodhi Leaf Component
// ===========================
function BodhiLeaf({ style }) {
  return (
    <div className="absolute pointer-events-none animate-falling-leaf z-20" style={style}>
      <svg
        viewBox="0 0 60 75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.7)]"
      >
        <path
          d="M30 8 C30 8 8 18 8 36 C8 50 18 60 30 62 C42 60 52 50 52 36 C52 18 30 8 30 8 Z"
          fill="url(#lf-grad)"
          stroke="#f59e0b"
          strokeWidth="1.2"
        />
        <path d="M30 62 C30 62 28 68 30 74 C32 68 30 62 30 62 Z" fill="#d97706" opacity="0.9"/>
        <path d="M30 10 L30 62" stroke="#b45309" strokeWidth="1.2" opacity="0.7"/>
        <path d="M30 22 L16 32 M30 32 L12 44 M30 44 L18 52 M30 22 L44 32 M30 32 L48 44 M30 44 L42 52" stroke="#b45309" strokeWidth="0.8" opacity="0.6"/>
        <defs>
          <linearGradient id="lf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#92400e" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Pre-generate 35 falling leaves
const LEAVES = Array.from({ length: 35 }).map((_, idx) => ({
  id: idx,
  left: `${(idx * 2.9 + 1) % 100}%`,
  animationDuration: `${3.5 + (idx % 7) * 0.6}s`,
  animationDelay: `${(idx % 11) * 0.22}s`,
  size: `${18 + (idx % 5) * 5}px`,
  opacity: 0.55 + (idx % 4) * 0.12,
  rotation: `${(idx * 47) % 360}deg`
}));

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 500);
    }, 3200);
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
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none cursor-pointer font-kantumruy transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ====== Magnificent Golden Bodhi Tree Artwork Background ====== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <img
          src="/bodhi_tree_bg.jpg"
          alt="ដើមពោធិ៍មាស"
          className="w-full h-full object-cover sm:object-contain scale-105 animate-tree-sway opacity-60 filter brightness-110 contrast-105"
        />
        {/* Radial Dark Vignette Overlay to highlight central logo emblem */}
        <div className="absolute inset-0 bg-radial from-slate-950/20 via-slate-950/60 to-slate-950/90 pointer-events-none"></div>
      </div>

      {/* Ambient Central Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-amber-500/25 rounded-full blur-[130px] pointer-events-none animate-pulse"></div>

      {/* ====== Falling Bodhi Leaves Animation ====== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {LEAVES.map((leaf) => (
          <BodhiLeaf
            key={leaf.id}
            style={{
              left: leaf.left,
              top: '-50px',
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

      {/* Top spacer */}
      <div className="h-10"></div>

      {/* ====== Center Golden Official Emblem Logo ====== */}
      <div className="z-10 flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border border-amber-400/40 animate-ping"></div>
          {/* Golden ambient glow behind logo */}
          <div className="absolute w-[120%] h-[120%] rounded-full bg-amber-500/20 blur-[25px]"></div>
          {/* Logo */}
          <img
            src="/app_logo.png"
            alt="ចាប់ស្លាកលេខ"
            className="relative w-full h-full object-contain rounded-full animate-float filter drop-shadow-[0_10px_35px_rgba(245,158,11,0.65)]"
            fetchpriority="high"
            decoding="async"
          />
        </div>
      </div>

      {/* ====== Bottom Title ====== */}
      <div className="z-10 flex flex-col items-center gap-2 pb-10">
        <h1 className="text-xl sm:text-2xl font-black text-amber-300 font-moul tracking-wide text-center drop-shadow-[0_2px_12px_rgba(245,158,11,0.7)]">
          ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
        </h1>
        <p className="text-xs text-amber-300/90 font-kantumruy flex items-center gap-1.5 drop-shadow">
          <span>🍃</span>
          <span>ដើមពោធិ៍ត្រជាក់ត្រជុំ • ស្លឹកធ្លាក់</span>
          <span>•</span>
          <span>ចុចដើម្បីរំលង</span>
        </p>
      </div>
    </div>
  );
}
