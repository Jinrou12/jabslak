import React, { useEffect, useState, useRef } from 'react';

// ===========================
// Beautiful Heart-Shaped Bodhi Leaf SVG (falling)
// ===========================
function BodhiLeaf({ style }) {
  return (
    <div className="absolute pointer-events-none animate-falling-leaf" style={style}>
      <svg
        viewBox="0 0 60 75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]"
      >
        {/* Heart-shaped Bodhi leaf with long drip-tip */}
        <path
          d="M30 8 C30 8 8 18 8 36 C8 50 18 60 30 62 C42 60 52 50 52 36 C52 18 30 8 30 8 Z"
          fill="url(#lf-grad)"
          stroke="#f59e0b"
          strokeWidth="1"
          opacity="0.95"
        />
        {/* Drip tip */}
        <path d="M30 62 C30 62 28 68 30 74 C32 68 30 62 30 62 Z" fill="#d97706" opacity="0.85"/>
        {/* Main vein */}
        <path d="M30 10 L30 62" stroke="#b45309" strokeWidth="1.2" opacity="0.7"/>
        {/* Side veins */}
        <path d="M30 22 L16 32 M30 32 L12 44 M30 44 L18 52 M30 22 L44 32 M30 32 L48 44 M30 44 L42 52"
          stroke="#b45309" strokeWidth="0.8" opacity="0.6"/>
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

// ===========================
// Beautiful Full Bodhi Tree SVG
// ===========================
function BodhiTreeSVG() {
  return (
    <svg
      viewBox="0 0 900 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      <defs>
        <radialGradient id="glow-center" cx="50%" cy="55%" r="45%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trunk-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#451a03" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#92400e" stopOpacity="0.9" />
          <stop offset="65%" stopColor="#d97706" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#451a03" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="branch-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#d97706" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id="leaf-cluster" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Ambient golden ground glow */}
      <ellipse cx="450" cy="960" rx="260" ry="30" fill="#f59e0b" opacity="0.12"/>
      <ellipse cx="450" cy="960" rx="160" ry="18" fill="#f59e0b" opacity="0.15"/>

      {/* Central Glow */}
      <ellipse cx="450" cy="500" rx="380" ry="380" fill="url(#glow-center)" />

      {/* ===== TRUNK ===== */}
      {/* Root flare left */}
      <path d="M370 960 C350 920 310 900 290 870 C300 865 330 875 360 900 C360 860 340 820 350 800 C360 795 375 808 375 830 Z"
        fill="url(#trunk-g)" />
      {/* Root flare right */}
      <path d="M530 960 C550 920 590 900 610 870 C600 865 570 875 540 900 C540 860 560 820 550 800 C540 795 525 808 525 830 Z"
        fill="url(#trunk-g)" />
      {/* Main trunk */}
      <path d="M390 960 C385 880 380 800 375 720 C370 640 365 580 360 510 C380 505 400 500 450 498 C500 500 520 505 540 510 C535 580 530 640 525 720 C520 800 515 880 510 960 Z"
        fill="url(#trunk-g)" />
      {/* Trunk highlight */}
      <path d="M440 960 C438 880 436 800 434 720 C432 640 430 580 428 510 L445 508 C445 580 445 640 445 720 C445 800 445 880 445 960 Z"
        fill="#fbbf24" opacity="0.12"/>

      {/* ===== MAIN BRANCHES ===== */}
      {/* Left main branch */}
      <path d="M380 560 C340 530 290 510 220 490 C200 484 198 500 215 506 C280 525 325 545 365 565 Z"
        fill="url(#branch-g)" strokeWidth="0"/>
      {/* Far left branch */}
      <path d="M365 540 C320 490 260 450 150 390 C130 380 125 398 145 408 C255 462 315 498 362 548 Z"
        fill="url(#branch-g)"/>
      {/* Far far left branch going up */}
      <path d="M360 520 C300 460 230 390 120 300 C102 287 98 306 116 318 C225 403 295 470 358 530 Z"
        fill="url(#branch-g)"/>

      {/* Right main branch */}
      <path d="M520 560 C560 530 610 510 680 490 C700 484 702 500 685 506 C620 525 575 545 535 565 Z"
        fill="url(#branch-g)"/>
      {/* Far right branch */}
      <path d="M535 540 C580 490 640 450 750 390 C770 380 775 398 755 408 C645 462 585 498 538 548 Z"
        fill="url(#branch-g)"/>
      {/* Far far right branch going up */}
      <path d="M540 520 C600 460 670 390 780 300 C798 287 802 306 784 318 C675 403 605 470 542 530 Z"
        fill="url(#branch-g)"/>

      {/* Center-left rising branch */}
      <path d="M430 530 C400 480 360 430 300 370 C284 354 278 370 292 384 C352 440 392 490 432 538 Z"
        fill="url(#branch-g)"/>
      {/* Center top branch going high */}
      <path d="M440 510 C420 450 400 380 380 280 C376 262 394 258 400 275 C420 370 438 442 448 515 Z"
        fill="url(#branch-g)"/>
      <path d="M460 510 C480 450 500 380 520 280 C524 262 506 258 500 275 C480 370 462 442 452 515 Z"
        fill="url(#branch-g)"/>
      {/* Center-right rising branch */}
      <path d="M470 530 C500 480 540 430 600 370 C616 354 622 370 608 384 C548 440 508 490 468 538 Z"
        fill="url(#branch-g)"/>

      {/* Sub-branches */}
      <path d="M220 490 C190 460 150 440 80 420 C64 415 62 430 78 436 C148 454 188 474 220 498 Z"
        fill="url(#branch-g)"/>
      <path d="M680 490 C710 460 750 440 820 420 C836 415 838 430 822 436 C752 454 712 474 680 498 Z"
        fill="url(#branch-g)"/>
      <path d="M150 390 C130 340 110 290 70 220 C60 204 76 196 86 210 C125 280 142 332 155 395 Z"
        fill="url(#branch-g)"/>
      <path d="M750 390 C770 340 790 290 830 220 C840 204 824 196 814 210 C775 280 758 332 745 395 Z"
        fill="url(#branch-g)"/>
      <path d="M300 370 C280 330 250 290 210 240 C198 226 212 216 222 228 C262 278 286 322 306 374 Z"
        fill="url(#branch-g)"/>
      <path d="M600 370 C620 330 650 290 690 240 C702 226 688 216 678 228 C638 278 614 322 594 374 Z"
        fill="url(#branch-g)"/>

      {/* ===== HEART-SHAPED LEAF CLUSTERS ===== */}
      {/* Bodhi leaf path function - heart shape with drip tip */}
      {/* Far left cluster */}
      <g opacity="0.88">
        <path d="M80 420 C80 420 60 408 60 420 C60 430 70 436 80 432 C90 436 100 430 100 420 C100 408 80 420 80 420 Z M80 432 L80 440" fill="url(#leaf-cluster)" />
        <ellipse cx="65" cy="408" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-25 65 408)"/>
        <ellipse cx="80" cy="400" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(5 80 400)"/>
        <ellipse cx="95" cy="408" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(25 95 408)"/>
        <ellipse cx="50" cy="420" rx="13" ry="16" fill="url(#leaf-cluster)" transform="rotate(-40 50 420)"/>
        <ellipse cx="110" cy="420" rx="13" ry="16" fill="url(#leaf-cluster)" transform="rotate(40 110 420)"/>
      </g>

      {/* Left mid cluster */}
      <g opacity="0.88">
        <ellipse cx="155" cy="380" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(-15 155 380)"/>
        <ellipse cx="138" cy="365" rx="15" ry="19" fill="url(#leaf-cluster)" transform="rotate(-35 138 365)"/>
        <ellipse cx="170" cy="362" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(10 170 362)"/>
        <ellipse cx="140" cy="395" rx="14" ry="17" fill="url(#leaf-cluster)" transform="rotate(-45 140 395)"/>
        <ellipse cx="175" cy="390" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(30 175 390)"/>
        <ellipse cx="125" cy="380" rx="13" ry="16" fill="url(#leaf-cluster)" transform="rotate(-55 125 380)"/>
      </g>

      {/* Left main upper cluster */}
      <g opacity="0.88">
        <ellipse cx="220" cy="468" rx="20" ry="25" fill="url(#leaf-cluster)" transform="rotate(-10 220 468)"/>
        <ellipse cx="198" cy="458" rx="17" ry="21" fill="url(#leaf-cluster)" transform="rotate(-30 198 458)"/>
        <ellipse cx="240" cy="452" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(15 240 452)"/>
        <ellipse cx="200" cy="480" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(-40 200 480)"/>
        <ellipse cx="240" cy="476" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(35 240 476)"/>
        <ellipse cx="180" cy="472" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-50 180 472)"/>
        <ellipse cx="258" cy="468" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(50 258 468)"/>
      </g>

      {/* Center-left upper cluster */}
      <g opacity="0.88">
        <ellipse cx="300" cy="355" rx="20" ry="24" fill="url(#leaf-cluster)" transform="rotate(-5 300 355)"/>
        <ellipse cx="280" cy="342" rx="17" ry="21" fill="url(#leaf-cluster)" transform="rotate(-25 280 342)"/>
        <ellipse cx="320" cy="338" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(20 320 338)"/>
        <ellipse cx="285" cy="368" rx="15" ry="19" fill="url(#leaf-cluster)" transform="rotate(-38 285 368)"/>
        <ellipse cx="315" cy="365" rx="15" ry="19" fill="url(#leaf-cluster)" transform="rotate(38 315 365)"/>
        <ellipse cx="262" cy="358" rx="14" ry="17" fill="url(#leaf-cluster)" transform="rotate(-55 262 358)"/>
        <ellipse cx="338" cy="356" rx="14" ry="17" fill="url(#leaf-cluster)" transform="rotate(55 338 356)"/>
      </g>

      {/* Center-left-top cluster */}
      <g opacity="0.85">
        <ellipse cx="360" cy="268" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(-8 360 268)"/>
        <ellipse cx="340" cy="255" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(-28 340 255)"/>
        <ellipse cx="378" cy="252" rx="17" ry="21" fill="url(#leaf-cluster)" transform="rotate(18 378 252)"/>
        <ellipse cx="345" cy="280" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-42 345 280)"/>
        <ellipse cx="375" cy="278" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(42 375 278)"/>
      </g>

      {/* Center top cluster (crown) */}
      <g opacity="0.92">
        <ellipse cx="450" cy="220" rx="28" ry="34" fill="url(#leaf-cluster)" transform="rotate(0 450 220)"/>
        <ellipse cx="420" cy="210" rx="22" ry="27" fill="url(#leaf-cluster)" transform="rotate(-18 420 210)"/>
        <ellipse cx="480" cy="210" rx="22" ry="27" fill="url(#leaf-cluster)" transform="rotate(18 480 210)"/>
        <ellipse cx="400" cy="225" rx="20" ry="25" fill="url(#leaf-cluster)" transform="rotate(-35 400 225)"/>
        <ellipse cx="500" cy="225" rx="20" ry="25" fill="url(#leaf-cluster)" transform="rotate(35 500 225)"/>
        <ellipse cx="425" cy="238" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(-22 425 238)"/>
        <ellipse cx="475" cy="238" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(22 475 238)"/>
        <ellipse cx="450" cy="198" rx="20" ry="25" fill="url(#leaf-cluster)" transform="rotate(0 450 198)"/>
        <ellipse cx="430" cy="185" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(-15 430 185)"/>
        <ellipse cx="470" cy="185" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(15 470 185)"/>
      </g>

      {/* Center-right-top cluster */}
      <g opacity="0.85">
        <ellipse cx="540" cy="268" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(8 540 268)"/>
        <ellipse cx="560" cy="255" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(28 560 255)"/>
        <ellipse cx="522" cy="252" rx="17" ry="21" fill="url(#leaf-cluster)" transform="rotate(-18 522 252)"/>
        <ellipse cx="555" cy="280" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(42 555 280)"/>
        <ellipse cx="525" cy="278" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-42 525 278)"/>
      </g>

      {/* Center-right upper cluster */}
      <g opacity="0.88">
        <ellipse cx="600" cy="355" rx="20" ry="24" fill="url(#leaf-cluster)" transform="rotate(5 600 355)"/>
        <ellipse cx="620" cy="342" rx="17" ry="21" fill="url(#leaf-cluster)" transform="rotate(25 620 342)"/>
        <ellipse cx="580" cy="338" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(-20 580 338)"/>
        <ellipse cx="615" cy="368" rx="15" ry="19" fill="url(#leaf-cluster)" transform="rotate(38 615 368)"/>
        <ellipse cx="585" cy="365" rx="15" ry="19" fill="url(#leaf-cluster)" transform="rotate(-38 585 365)"/>
        <ellipse cx="638" cy="358" rx="14" ry="17" fill="url(#leaf-cluster)" transform="rotate(55 638 358)"/>
        <ellipse cx="562" cy="356" rx="14" ry="17" fill="url(#leaf-cluster)" transform="rotate(-55 562 356)"/>
      </g>

      {/* Right main upper cluster */}
      <g opacity="0.88">
        <ellipse cx="680" cy="468" rx="20" ry="25" fill="url(#leaf-cluster)" transform="rotate(10 680 468)"/>
        <ellipse cx="702" cy="458" rx="17" ry="21" fill="url(#leaf-cluster)" transform="rotate(30 702 458)"/>
        <ellipse cx="660" cy="452" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(-15 660 452)"/>
        <ellipse cx="700" cy="480" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(40 700 480)"/>
        <ellipse cx="660" cy="476" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(-35 660 476)"/>
        <ellipse cx="720" cy="472" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(50 720 472)"/>
        <ellipse cx="642" cy="468" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-50 642 468)"/>
      </g>

      {/* Right mid cluster */}
      <g opacity="0.88">
        <ellipse cx="745" cy="380" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(15 745 380)"/>
        <ellipse cx="762" cy="365" rx="15" ry="19" fill="url(#leaf-cluster)" transform="rotate(35 762 365)"/>
        <ellipse cx="730" cy="362" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(-10 730 362)"/>
        <ellipse cx="760" cy="395" rx="14" ry="17" fill="url(#leaf-cluster)" transform="rotate(45 760 395)"/>
        <ellipse cx="725" cy="390" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-30 725 390)"/>
        <ellipse cx="775" cy="380" rx="13" ry="16" fill="url(#leaf-cluster)" transform="rotate(55 775 380)"/>
      </g>

      {/* Far right cluster */}
      <g opacity="0.88">
        <ellipse cx="820" cy="420" rx="18" ry="22" fill="url(#leaf-cluster)" transform="rotate(20 820 420)"/>
        <ellipse cx="835" cy="408" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(40 835 408)"/>
        <ellipse cx="820" cy="400" rx="16" ry="20" fill="url(#leaf-cluster)" transform="rotate(-5 820 400)"/>
        <ellipse cx="805" cy="408" rx="14" ry="18" fill="url(#leaf-cluster)" transform="rotate(-25 805 408)"/>
        <ellipse cx="840" cy="430" rx="13" ry="16" fill="url(#leaf-cluster)" transform="rotate(50 840 430)"/>
        <ellipse cx="802" cy="428" rx="13" ry="16" fill="url(#leaf-cluster)" transform="rotate(-40 802 428)"/>
      </g>

    </svg>
  );
}

// Pre-generate 35 falling leaves
const LEAVES = Array.from({ length: 35 }).map((_, idx) => ({
  id: idx,
  left: `${(idx * 2.9 + 1) % 100}%`,
  animationDuration: `${3.5 + (idx % 7) * 0.6}s`,
  animationDelay: `${(idx % 11) * 0.22}s`,
  size: `${18 + (idx % 5) * 5}px`,
  opacity: 0.5 + (idx % 4) * 0.12,
  rotation: `${(idx * 47) % 360}deg`
}));

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onFinish, 500);
    }, 3000);
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
      {/* ====== Beautiful Bodhi Tree Background (fills full screen) ====== */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden">
        <div className="w-full h-[95%] max-w-3xl opacity-55 animate-tree-sway">
          <BodhiTreeSVG />
        </div>
      </div>

      {/* Ambient central golden glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-amber-500/18 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      {/* ====== Falling Bodhi Leaves ====== */}
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
      <div className="h-10" />

      {/* ====== Center Golden Official Emblem Logo ====== */}
      <div className="z-10 flex flex-col items-center justify-center">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping"></div>
          {/* Golden ambient glow behind logo */}
          <div className="absolute w-[115%] h-[115%] rounded-full bg-amber-500/15 blur-[20px]"></div>
          {/* Logo */}
          <img
            src="/app_logo.png"
            alt="ចាប់ស្លាកលេខ"
            className="relative w-full h-full object-contain rounded-full animate-float filter drop-shadow-[0_8px_28px_rgba(245,158,11,0.55)]"
            fetchpriority="high"
            decoding="async"
          />
        </div>
      </div>

      {/* ====== Bottom Title ====== */}
      <div className="z-10 flex flex-col items-center gap-2 pb-10">
        <h1 className="text-xl sm:text-2xl font-black text-amber-300 font-moul tracking-wide text-center drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
          ប្រព័ន្ធគ្រប់គ្រងស្លាកលេខ
        </h1>
        <p className="text-xs text-amber-400/80 font-kantumruy flex items-center gap-1.5">
          <span>🍃</span>
          <span>ដើមពោធិ៍ • ស្លឹកធ្លាក់</span>
          <span>•</span>
          <span>ចុចដើម្បីរំលង</span>
        </p>
      </div>
    </div>
  );
}
