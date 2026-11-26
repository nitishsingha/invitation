import React from 'react';
import type { OrnamentStyle, PatternType } from '../../types/invitation';

export function PatternOverlay({
  pattern,
  color,
}: {
  pattern: PatternType;
  color: string;
}) {
  if (pattern === 'none') return null;

  if (pattern === 'mandala') {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 18%, ${color} 19%, transparent 20%, transparent 38%, ${color} 39%, transparent 40%)`,
          backgroundSize: '96px 96px',
        }}
      />
    );
  }

  if (pattern === 'geometric') {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(45deg, ${color} 1px, transparent 1px), linear-gradient(-45deg, ${color} 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />
    );
  }

  if (pattern === 'confetti') {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(${color} 1.5px, transparent 1.5px)`,
          backgroundSize: '28px 28px',
        }}
      />
    );
  }

  if (pattern === 'botanical') {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 20%, ${color} 1px, transparent 1px), radial-gradient(ellipse at 80% 80%, ${color} 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }}
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.05]"
      aria-hidden="true"
      style={{
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }}
    />
  );
}

export function CardCornerOrnaments({
  styleType,
  accentColor,
  secondaryColor,
}: {
  styleType: OrnamentStyle;
  accentColor: string;
  secondaryColor: string;
}) {
  if (styleType === 'minimal-hairline') {
    return (
      <div
        className="pointer-events-none absolute inset-3 rounded-lg"
        style={{ border: `1px solid ${secondaryColor}40` }}
        aria-hidden="true"
      />
    );
  }

  if (styleType === 'art-deco') {
    return (
      <>
        <svg
          className="pointer-events-none absolute top-3 left-3 w-12 h-12 opacity-75"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 60V4H60" stroke={secondaryColor} strokeWidth="1.5" />
          <path d="M12 44V12H44" stroke={accentColor} strokeWidth="1" />
          <path d="M4 20L20 4" stroke={secondaryColor} strokeWidth="1.2" />
        </svg>
        <svg
          className="pointer-events-none absolute top-3 right-3 w-12 h-12 opacity-75 scale-x-[-1]"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 60V4H60" stroke={secondaryColor} strokeWidth="1.5" />
          <path d="M12 44V12H44" stroke={accentColor} strokeWidth="1" />
          <path d="M4 20L20 4" stroke={secondaryColor} strokeWidth="1.2" />
        </svg>
        <svg
          className="pointer-events-none absolute bottom-3 left-3 w-12 h-12 opacity-75 scale-y-[-1]"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 60V4H60" stroke={secondaryColor} strokeWidth="1.5" />
          <path d="M12 44V12H44" stroke={accentColor} strokeWidth="1" />
          <path d="M4 20L20 4" stroke={secondaryColor} strokeWidth="1.2" />
        </svg>
        <svg
          className="pointer-events-none absolute bottom-3 right-3 w-12 h-12 opacity-75 scale-[-1]"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 60V4H60" stroke={secondaryColor} strokeWidth="1.5" />
          <path d="M12 44V12H44" stroke={accentColor} strokeWidth="1" />
          <path d="M4 20L20 4" stroke={secondaryColor} strokeWidth="1.2" />
        </svg>
      </>
    );
  }

  if (styleType === 'temple-toran') {
    return (
      <svg
        className="pointer-events-none absolute top-0 left-0 right-0 w-full h-14 opacity-85"
        viewBox="0 0 400 56"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 6 Q50 38 100 6 Q150 38 200 6 Q250 38 300 6 Q350 38 400 6"
          stroke={secondaryColor}
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="50" cy="22" r="5" fill={accentColor} />
        <circle cx="150" cy="22" r="5" fill={accentColor} />
        <circle cx="250" cy="22" r="5" fill={accentColor} />
        <circle cx="350" cy="22" r="5" fill={accentColor} />
        <circle cx="100" cy="10" r="3" fill={secondaryColor} />
        <circle cx="200" cy="10" r="3" fill={secondaryColor} />
        <circle cx="300" cy="10" r="3" fill={secondaryColor} />
      </svg>
    );
  }

  if (styleType === 'festive-bunting') {
    return (
      <svg
        className="pointer-events-none absolute top-0 left-0 right-0 w-full h-12 opacity-80"
        viewBox="0 0 400 48"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 4 Q200 22 400 4" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
        <polygon points="30,6 46,24 62,6" fill={accentColor} opacity="0.85" />
        <polygon points="82,9 98,27 114,9" fill={secondaryColor} opacity="0.85" />
        <polygon points="134,12 150,30 166,12" fill={accentColor} opacity="0.85" />
        <polygon points="186,13 202,31 218,13" fill={secondaryColor} opacity="0.85" />
        <polygon points="238,12 254,30 270,12" fill={accentColor} opacity="0.85" />
        <polygon points="290,9 306,27 322,9" fill={secondaryColor} opacity="0.85" />
        <polygon points="342,6 358,24 374,6" fill={accentColor} opacity="0.85" />
      </svg>
    );
  }

  // royal-arch or floral-corner
  return (
    <>
      <svg
        className="pointer-events-none absolute top-3 left-3 w-14 h-14 opacity-80"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 54C6 28 28 6 54 6"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <circle cx="14" cy="14" r="4" fill={accentColor} opacity="0.85" />
        <circle cx="24" cy="10" r="2.5" fill={secondaryColor} opacity="0.8" />
        <circle cx="10" cy="24" r="2.5" fill={secondaryColor} opacity="0.8" />
      </svg>
      <svg
        className="pointer-events-none absolute top-3 right-3 w-14 h-14 opacity-80 scale-x-[-1]"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 54C6 28 28 6 54 6"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <circle cx="14" cy="14" r="4" fill={accentColor} opacity="0.85" />
        <circle cx="24" cy="10" r="2.5" fill={secondaryColor} opacity="0.8" />
        <circle cx="10" cy="24" r="2.5" fill={secondaryColor} opacity="0.8" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-3 left-3 w-14 h-14 opacity-80 scale-y-[-1]"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 54C6 28 28 6 54 6"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <circle cx="14" cy="14" r="4" fill={accentColor} opacity="0.85" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-3 right-3 w-14 h-14 opacity-80 scale-[-1]"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 54C6 28 28 6 54 6"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <circle cx="14" cy="14" r="4" fill={accentColor} opacity="0.85" />
      </svg>
    </>
  );
}

export function FloatingParticles({
  type,
  accentColor,
  secondaryColor,
  disabled,
}: {
  type: 'petals' | 'gold-dust' | 'confetti' | 'hearts' | 'diyas' | 'none';
  accentColor: string;
  secondaryColor: string;
  disabled?: boolean;
}) {
  if (disabled || type === 'none') return null;

  const items = Array.from({ length: 14 }, (_, idx) => ({
    id: idx,
    left: `${(idx * 7.3 + 4) % 94}%`,
    delay: `${(idx * 0.65) % 4.5}s`,
    duration: `${6 + (idx % 5) * 1.4}s`,
    size: 6 + (idx % 3) * 3,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute -top-6 rounded-full opacity-45 animate-[bounce_7s_ease-in-out_infinite]"
          style={{
            left: p.left,
            top: `${(p.id * 11) % 88}%`,
            width: `${p.size}px`,
            height: type === 'petals' ? `${p.size * 1.4}px` : `${p.size}px`,
            backgroundColor: p.id % 2 === 0 ? secondaryColor : accentColor,
            borderRadius: type === 'petals' ? '60% 40% 60% 40%' : '9999px',
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export function OrnamentalDivider({
  accentColor,
  secondaryColor,
}: {
  accentColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
      <div
        className="h-px flex-1 max-w-[96px]"
        style={{
          background: `linear-gradient(to right, transparent, ${secondaryColor}90)`,
        }}
      />
      <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
        <path
          d="M12 1L16 7L12 13L8 7L12 1Z"
          stroke={secondaryColor}
          strokeWidth="1.2"
          fill={`${accentColor}22`}
        />
        <circle cx="3" cy="7" r="1.5" fill={secondaryColor} opacity="0.75" />
        <circle cx="21" cy="7" r="1.5" fill={secondaryColor} opacity="0.75" />
      </svg>
      <div
        className="h-px flex-1 max-w-[96px]"
        style={{
          background: `linear-gradient(to left, transparent, ${secondaryColor}90)`,
        }}
      />
    </div>
  );
}

