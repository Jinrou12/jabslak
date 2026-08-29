import React, { useEffect, useRef, useState } from 'react';

// ===========================
// Dark Brown Heart-Shaped Bodhi Leaf — matches the tree artwork style
// ===========================
function BodhiLeaf({ style }) {
  return (
    <div className="absolute pointer-events-none animate-falling-leaf z-20" style={style}>
      <svg viewBox="0 0 50 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Heart-shaped leaf body */}
        <path
          d="M25 6 C25 6 6 16 6 32 C6 46 15 56 25 58 C35 56 44 46 44 32 C44 16 25 6 25 6 Z"
          fill="#3d1f00"
          stroke="#7c4a00"
          strokeWidth="1"
          opacity="0.92"
        />
        {/* Drip tip */}
        <path d="M25 58 L25 64" stroke="#3d1f00" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
        {/* Center vein */}
        <path d="M25 8 L25 58" stroke="#7c4a00" strokeWidth="1" opacity="0.5"/>
        {/* Side veins */}
        <path d="M25 20 L14 28 M25 30 L10 40 M25 42 L15 48 M25 20 L36 28 M25 30 L40 40 M25 42 L35 48"
          stroke="#7c4a00" strokeWidth="0.7" opacity="0.4"/>
      </svg>
    </div>
  );
}

// Pre-generate 30 falling leaves — varied size, speed, position
const LEAVES = Array.from({ length: 30 }).map((_, idx) => ({
  id: idx,
  left: `${(idx * 3.4 + 2) % 100}%`,
  animationDuration: `${4 + (idx % 7) * 0.65}s`,
  animationDelay: `${(idx % 10) * 0.28}s`,
  size: `${22 + (idx % 5) * 6}px`,
  opacity: 0.55 + (idx % 3) * 0.2,
  rotation: `${(idx * 53) % 360}deg`
}));

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 500);
    }, 3500);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer font-kantumruy transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ====== Bodhi Tree — full image, inner branch ring aligned dead-center on logo emblem ====== */}
      <div
        className="absolute inset-0 pointer-events-none animate-tree-sway"
        style={{
          backgroundColor: '#f4ece0',
          backgroundImage: 'url(/bodhi_bg_v10.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: '50% 50%',
          backgroundRepeat: 'no-repeat',
          transformOrigin: '50% 50%',
        }}
      >
        {/* Golden ambient center spotlight highlight */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.18)_0%,_transparent_60%)]" />

        {/* Soft dark-gold top/bottom gradients for title readability */}
        <div className="absolute inset-0"
          style={{background: 'linear-gradient(to bottom, rgba(25, 16, 6, 0.55) 0%, rgba(25, 16, 6, 0.05) 20%, transparent 40%, transparent 65%, rgba(25, 16, 6, 0.35) 85%, rgba(25, 16, 6, 0.7) 100%)'}}
        />
      </div>

      {/* ====== Falling Dark Bodhi Leaves ====== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        {LEAVES.map((leaf) => (
          <BodhiLeaf
            key={leaf.id}
            style={{
              left: leaf.left,
              top: '-60px',
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

      {/* ====== Center Emblem Logo — Dead-centered on screen & tree ====== */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Soft warm halo */}
          <div className="absolute w-[130%] h-[130%] rounded-full bg-amber-400/25 blur-[30px]"></div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border border-amber-300/30 animate-ping"></div>
          {/* Logo */}
          <img
            src="/app_logo.png"
            alt="ចាប់ស្លាកលេខ"
            className="relative w-full h-full object-contain rounded-full animate-float filter drop-shadow-[0_8px_30px_rgba(200,130,0,0.8)]"
            fetchpriority="high"
            decoding="async"
          />
        </div>
      </div>

      {/* ====== Bottom Title ====== */}
      <div className="absolute bottom-5 sm:bottom-8 z-10 flex flex-col items-center gap-1 px-4 text-center">
        <h1 className="text-sm sm:text-base font-black text-amber-200 font-moul tracking-wide text-center"
          style={{textShadow: '0 2px 12px rgba(180,100,0,0.9), 0 1px 4px rgba(0,0,0,0.9)'}}>
          ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
        </h1>
        <p className="text-[10px] text-amber-300/70 font-kantumruy flex items-center gap-1"
          style={{textShadow: '0 1px 6px rgba(0,0,0,0.9)'}}>
          <span>🍃 ដើមពោធិ៍ • ស្លឹកធ្លាក់</span>
          <span>•</span>
          <span>ចុចដើម្បីរំលង</span>
        </p>
      </div>
    </div>
  );
}
