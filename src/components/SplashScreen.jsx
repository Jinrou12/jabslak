import React, { useEffect, useState, useRef } from 'react';

// SVG Bodhi Leaf Component with golden gradient & glow
function BodhiLeaf({ style }) {
  return (
    <div className="absolute pointer-events-none animate-falling-leaf" style={style}>
      <svg
        width="24"
        height="28"
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]"
      >
        <path
          d="M50 5 C50 5 15 35 15 70 C15 95 32 110 50 110 C68 110 85 95 85 70 C85 35 50 5 50 5 Z M50 110 L50 120"
          fill="url(#leaf-gold-grad)"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <path d="M50 20 L50 100 M50 45 L30 35 M50 60 L25 50 M50 75 L30 68 M50 45 L70 35 M50 60 L75 50 M50 75 L70 68" stroke="#d97706" strokeWidth="1.5" opacity="0.8" />
        <defs>
          <linearGradient id="leaf-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.75" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Spreading Golden Bodhi Tree SVG Background Component
function BodhiTreeBg() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-end justify-center overflow-hidden opacity-30 sm:opacity-40">
      <div className="relative w-full max-w-5xl h-[85vh] animate-tree-sway flex items-end justify-center">
        <svg
          viewBox="0 0 800 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]"
        >
          <defs>
            <linearGradient id="tree-trunk-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#78350f" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="canopy-glow" cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#d97706" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Golden Canopy Glow */}
          <circle cx="400" cy="300" r="380" fill="url(#canopy-glow)" />

          {/* Trunk & Main Branches */}
          <path
            d="M370 900 C370 750 350 650 310 520 C280 420 230 350 120 280 C110 274 130 260 150 270 C240 330 290 390 330 480 C360 380 340 280 280 180 C270 165 290 155 305 168 C360 250 385 340 385 450 C385 350 415 250 470 168 C485 155 505 165 495 180 C435 280 415 380 445 480 C485 390 535 330 625 270 C645 260 665 274 655 280 C545 350 495 420 465 520 C425 650 405 750 405 900 Z"
            fill="url(#tree-trunk-grad)"
          />

          {/* Secondary Delicate Branches */}
          <path
            d="M330 480 C280 440 210 400 130 380 C120 375 135 360 148 368 C220 388 285 425 330 460 Z
               M445 480 C495 440 565 400 645 380 C655 375 640 360 627 368 C555 388 490 425 445 460 Z
               M385 450 C340 340 310 240 290 140 C285 125 300 120 310 130 C330 225 358 320 385 420 Z
               M385 450 C430 340 460 240 480 140 C485 125 470 120 460 130 C440 225 412 320 385 420 Z"
            fill="#f59e0b"
            opacity="0.75"
          />

          {/* Clusters of Golden Bodhi Leaves on Branches */}
          <g fill="#fbbf24" opacity="0.85">
            {/* Left Canopy */}
            <circle cx="160" cy="270" r="14" />
            <circle cx="210" cy="320" r="16" />
            <circle cx="120" cy="370" r="18" />
            <circle cx="240" cy="240" r="20" />
            <circle cx="180" cy="200" r="15" />
            {/* Center Canopy */}
            <circle cx="290" cy="160" r="18" />
            <circle cx="340" cy="120" r="22" />
            <circle cx="400" cy="100" r="25" />
            <circle cx="460" cy="120" r="22" />
            <circle cx="510" cy="160" r="18" />
            {/* Right Canopy */}
            <circle cx="640" cy="270" r="14" />
            <circle cx="590" cy="320" r="16" />
            <circle cx="680" cy="370" r="18" />
            <circle cx="560" cy="240" r="20" />
            <circle cx="620" cy="200" r="15" />
          </g>
        </svg>
      </div>
    </div>
  );
}

// Pre-generate 30 falling leaves once at module level
const LEAVES = Array.from({ length: 30 }).map((_, idx) => ({
  id: idx,
  left: `${(idx * 3.3 + 1) % 100}%`,
  animationDuration: `${3.2 + (idx % 6) * 0.7}s`,
  animationDelay: `${(idx % 10) * 0.25}s`,
  size: `${16 + (idx % 6) * 4}px`,
  opacity: 0.45 + (idx % 4) * 0.15,
  rotation: `${(idx * 43) % 360}deg`
}));

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Auto dismiss after 2.8s
    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 500);
    }, 2800);
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
      {/* Swaying Golden Bodhi Tree in Background */}
      <BodhiTreeBg />

      {/* Ambient Central Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-amber-500/20 rounded-full blur-[110px] pointer-events-none animate-pulse"></div>

      {/* Falling Bodhi Leaves Animation */}
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

      {/* Center Golden Official Emblem Logo */}
      <div className="flex flex-col items-center justify-center gap-4 z-10">
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center filter drop-shadow-[0_12px_35px_rgba(245,158,11,0.55)]">
          {/* Pulsing outer ring */}
          <div className="absolute inset-0 rounded-full border border-amber-400/40 animate-ping"></div>
          {/* Official emblem logo */}
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
        <h1 className="text-xl sm:text-2xl font-black text-amber-300 font-moul tracking-wide text-center drop-shadow-md">
          ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
        </h1>
        <p className="text-xs text-amber-400/90 font-kantumruy flex items-center gap-2">
          <span>🍃 ដើមពោធិ៍ត្រជាក់ត្រជុំ • ខ្យល់បក់រវិចៗ</span>
          <span>•</span>
          <span>ចុចដើម្បីរំលង</span>
        </p>
      </div>
    </div>
  );
}
