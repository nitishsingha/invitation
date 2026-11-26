import React, { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function computeTimeLeft(dateStr: string, timeStr?: string): TimeLeft {
  if (!dateStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const normalizedTime = timeStr && /^\d{2}:\d{2}/.test(timeStr) ? timeStr.slice(0, 5) : '18:00';
  const target = new Date(`${dateStr}T${normalizedTime}:00`).getTime();
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

export function CountdownTimer({
  eventDate,
  startTime,
  accentColor,
  cardSurface,
  primaryText,
  secondaryText,
  borderColor,
}: {
  eventDate: string;
  startTime?: string;
  accentColor: string;
  cardSurface: string;
  primaryText: string;
  secondaryText: string;
  borderColor: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    computeTimeLeft(eventDate, startTime)
  );

  useEffect(() => {
    setTimeLeft(computeTimeLeft(eventDate, startTime));
    const timer = window.setInterval(() => {
      setTimeLeft(computeTimeLeft(eventDate, startTime));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [eventDate, startTime]);

  if (timeLeft.isPast) return null;

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
      {blocks.map((block) => (
        <div
          key={block.label}
          className="rounded-xl py-3 px-2 text-center"
          style={{
            backgroundColor: cardSurface,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div
            className="text-2xl sm:text-3xl font-mono font-medium tabular-nums"
            style={{ color: accentColor }}
          >
            {String(block.value).padStart(2, '0')}
          </div>
          <div
            className="text-[11px] mt-1 tracking-wide"
            style={{ color: secondaryText }}
          >
            {block.label}
          </div>
        </div>
      ))}
    </div>
  );
}
