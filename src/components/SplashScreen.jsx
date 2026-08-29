import React, { useEffect, useRef, useState } from 'react';



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
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: '#f4ece0',
          backgroundImage: 'url(/bodhi_tree_transparent.png)',
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

      {/* ====== Center Emblem Logo — Dead-centered on screen & tree (STATIC) ====== */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Soft warm halo */}
          <div className="absolute w-[130%] h-[130%] rounded-full bg-amber-400/25 blur-[30px]"></div>
          {/* Static ring */}
          <div className="absolute inset-0 rounded-full border border-amber-300/30"></div>
          {/* Logo — Static without floating animation */}
          <img
            src="/app_logo.png"
            alt="ចាប់ស្លាកលេខ"
            className="relative w-full h-full object-contain rounded-full filter drop-shadow-[0_8px_30px_rgba(200,130,0,0.8)]"
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
          <span>🍃 ដើមពោធិ៍</span>
          <span>•</span>
          <span>ចុចដើម្បីរំលង</span>
        </p>
      </div>
    </div>
  );
}
