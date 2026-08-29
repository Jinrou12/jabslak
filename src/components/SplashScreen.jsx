import React, { useEffect, useState } from 'react';

// SVG Bodhi Leaf Component with golden / emerald gradient
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
        {/* Sacred Bodhi Leaf Shape */}
        <path
          d="M50 5 C50 5 15 35 15 70 C15 95 32 110 50 110 C68 110 85 95 85 70 C85 35 50 5 50 5 Z M50 110 L50 120"
          fill="url(#leaf-gold-grad)"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        {/* Veins */}
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

export default function SplashScreen({ onFinish }) {
  const [leaves, setLeaves] = useState([]);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Generate 25 randomized falling leaves
    const leafArray = Array.from({ length: 25 }).map((_, idx) => ({
      id: idx,
      left: `${Math.random() * 100}%`,
      animationDuration: `${3.5 + Math.random() * 4}s`,
      animationDelay: `${Math.random() * 2.5}s`,
      size: `${16 + Math.random() * 20}px`,
      opacity: 0.4 + Math.random() * 0.5,
      rotation: `${Math.random() * 360}deg`
    }));
    setLeaves(leafArray);

    // Auto dismiss after 2.8s
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onFinish();
      }, 500); // 500ms fade out transition
    }, 2800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 300);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 overflow-hidden select-none cursor-pointer font-kantumruy transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Gold Particle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000"></div>

      {/* Falling Bodhi Leaves Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {leaves.map((leaf) => (
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
      <div className="flex flex-col items-center justify-center gap-4 z-10 animate-in zoom-in-75 duration-700">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center filter drop-shadow-[0_10px_30px_rgba(245,158,11,0.45)]">
          {/* Pulsing ring around logo */}
          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping duration-1000"></div>
          <img
            src="/app_logo.png"
            alt="ចាប់ស្លាកលេខ"
            className="w-full h-full object-contain animate-float"
          />
        </div>
      </div>

      {/* Bottom Title */}
      <div className="flex flex-col items-center gap-2 z-10 mb-6 animate-in slide-in-from-bottom-6 duration-700">
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
