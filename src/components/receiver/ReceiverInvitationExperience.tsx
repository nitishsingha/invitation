import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  Gift,
  Heart,
  MapPin,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getThemeById } from '../../data/themes';
import { ambientPlayer } from '../../lib/ambientAudio';
import {
  buildGuestDisplayGreeting,
  formatDisplayDate,
  formatDisplayTime,
} from '../../lib/utils';
import { submitGuestRsvp } from '../../services/invitationService';
import type {
  PublicInvitationSnapshot,
  RsvpStatus,
} from '../../types/invitation';
import { VenueMapView } from '../maps/VenueMapView';
import { CountdownTimer } from './CountdownTimer';
import {
  CardCornerOrnaments,
  FloatingParticles,
  OrnamentalDivider,
  PatternOverlay,
} from './ThemeOrnamentSvg';

interface ReceiverInvitationExperienceProps {
  snapshot: PublicInvitationSnapshot;
  guestName: string;
  isFamilyInvitation?: boolean;
  customGreeting?: string;
  token?: string;
  isPreview?: boolean;
  initialRsvpStatus?: RsvpStatus;
  initialRsvpAttendees?: number;
  initialRsvpMessage?: string;
  onClosePreview?: () => void;
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.52;
}

export function ReceiverInvitationExperience({
  snapshot,
  guestName,
  isFamilyInvitation = false,
  customGreeting = '',
  token,
  isPreview = false,
  initialRsvpStatus = 'none',
  initialRsvpAttendees = 1,
  initialRsvpMessage = '',
  onClosePreview,
}: ReceiverInvitationExperienceProps) {
  const theme = getThemeById(snapshot.themeId);
  const customization = snapshot.customization ?? {
    backgroundColor: theme.palette.background,
    cardColor: theme.palette.cardSurface,
    accentColor: theme.palette.accent,
    textColor: theme.palette.primaryText,
    fontChoice: theme.fontFamily,
    pattern: theme.pattern,
    ornamentStyle: theme.ornamentStyle,
    floralDecorations: true,
    reducedParticles: false,
    musicMood: 'none' as const,
  };
  const settings = snapshot.settings ?? {
    rsvpEnabled: true,
    countdownEnabled: true,
    galleryEnabled: true,
    locationsEnabled: true,
    qrEnabled: true,
  };
  const eventData = snapshot.eventData ?? {
    eventDate: '',
    startTime: '',
    primaryVenue: '',
  };
  const images = Array.isArray(snapshot.images) ? snapshot.images : [];
  const schedules = Array.isArray(snapshot.schedules) ? snapshot.schedules : [];

  const bg = customization.backgroundColor || theme.palette.background;
  const cardBg = customization.cardColor || theme.palette.cardSurface;
  const accent = customization.accentColor || theme.palette.accent;
  const secondaryAccent = theme.palette.accentSecondary;
  const primaryText = customization.textColor || theme.palette.primaryText;
  const secondaryText = theme.palette.secondaryText;
  const borderColor = theme.palette.border;
  const sequence = theme.sequenceType;
  const darkBg = isDarkHex(bg);
  const darkCard = isDarkHex(cardBg);
  const canvasText = darkBg ? '#FBF7F0' : primaryText;
  const canvasMuted = darkBg ? '#E5D5B5' : secondaryText;
  const inputBg = darkCard ? '#242429' : '#FFFFFF';

  const displayGuest = buildGuestDisplayGreeting(guestName, isFamilyInvitation);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Multi-stage interactive ceremony
  // Stage 1: Personalized Welcome Card
  // Stage 2: Rolled Scroll with Thread & Yarn (envelope-ribbon) / Love Letter Envelope / Gift Box / Mandala Curtain
  // Stage 4: Unified Folded Stationery Invitation Page
  const [stage, setStage] = useState<1 | 2 | 4>(1);
  const [isAnimatingStage, setIsAnimatingStage] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  // Horizontal gallery strip + Lightbox
  const horizontalGalleryRef = useRef<HTMLDivElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const scrollGalleryHorizontally = (dir: -1 | 1) => {
    const el = horizontalGalleryRef.current;
    if (!el) return;
    const step = Math.max(280, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // RSVP state
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(initialRsvpStatus);
  const [rsvpAttendees, setRsvpAttendees] = useState<number>(initialRsvpAttendees || 1);
  const [rsvpMessage, setRsvpMessage] = useState<string>(initialRsvpMessage);
  const [rsvpSaving, setRsvpSaving] = useState(false);
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);

  // GSAP refs for Rolled Scroll + Thread & Yarn
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const scrollTubeRef = useRef<HTMLDivElement>(null);
  const yarnCoilsRef = useRef<SVGGElement>(null);
  const yarnKnotRef = useRef<SVGGElement>(null);
  const yarnTailLeftRef = useRef<SVGPathElement>(null);
  const yarnTailRightRef = useRef<SVGPathElement>(null);
  const unrollSheetRef = useRef<HTMLDivElement>(null);

  // GSAP refs for other sequences
  const flapRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const giftLidRef = useRef<HTMLDivElement>(null);
  const curtainLeftRef = useRef<HTMLDivElement>(null);
  const curtainRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      ambientPlayer.stop();
    };
  }, []);

  const toggleMusic = () => {
    if (musicOn) {
      ambientPlayer.stop();
      setMusicOn(false);
    } else {
      ambientPlayer.start(
        customization.musicMood === 'none' ? 'harp-bliss' : customization.musicMood
      );
      setMusicOn(true);
    }
  };

  const handleOpenStage1 = () => {
    if (prefersReducedMotion) {
      setStage(4);
      return;
    }
    setStage(2);
  };

  // Phase 1: Turn scroll & unwind thread/yarn; Phase 2: Unroll open invitation
  const handleUnrollScrollWithYarn = () => {
    if (isAnimatingStage) return;
    if (prefersReducedMotion) {
      setStage(4);
      return;
    }
    setIsAnimatingStage(true);
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimatingStage(false);
        setStage(4);
      },
    });

    // Gently turn the scroll as the yarn unwinds
    if (scrollWrapRef.current) {
      tl.to(scrollWrapRef.current, {
        rotate: -4,
        scale: 1.03,
        duration: 0.28,
        ease: 'power2.out',
      }).to(scrollWrapRef.current, {
        rotate: 2,
        duration: 0.35,
        ease: 'power1.inOut',
      });
    }

    // Untie yarn bow and unwind thread tails outward
    if (yarnKnotRef.current) {
      tl.to(
        yarnKnotRef.current,
        {
          scale: 1.25,
          rotate: 28,
          opacity: 0,
          y: -14,
          transformOrigin: '50% 50%',
          duration: 0.45,
          ease: 'power2.in',
        },
        0.12
      );
    }
    if (yarnTailLeftRef.current) {
      tl.to(
        yarnTailLeftRef.current,
        {
          x: -55,
          y: 26,
          rotate: -28,
          opacity: 0,
          duration: 0.55,
          ease: 'power2.out',
        },
        0.15
      );
    }
    if (yarnTailRightRef.current) {
      tl.to(
        yarnTailRightRef.current,
        {
          x: 55,
          y: 26,
          rotate: 28,
          opacity: 0,
          duration: 0.55,
          ease: 'power2.out',
        },
        0.15
      );
    }
    if (yarnCoilsRef.current) {
      tl.to(
        yarnCoilsRef.current,
        {
          scaleY: 1.35,
          scaleX: 1.15,
          opacity: 0,
          transformOrigin: '50% 50%',
          duration: 0.5,
          ease: 'power2.inOut',
        },
        0.28
      );
    }

    // Unroll the parchment cylinder & unfold the sheet open
    if (scrollTubeRef.current) {
      tl.to(
        scrollTubeRef.current,
        {
          scaleY: 0.28,
          opacity: 0,
          y: -70,
          duration: 0.5,
          ease: 'power3.inOut',
        },
        0.72
      );
    }
    if (unrollSheetRef.current) {
      tl.fromTo(
        unrollSheetRef.current,
        { scaleY: 0.12, opacity: 0, y: 12 },
        {
          scaleY: 1,
          opacity: 1,
          y: 0,
          duration: 0.62,
          ease: 'power3.out',
        },
        0.78
      );
    }
  };

  const handleEnvelopeOpen = () => {
    if (isAnimatingStage) return;
    if (prefersReducedMotion) {
      setStage(4);
      return;
    }
    setIsAnimatingStage(true);
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimatingStage(false);
        setStage(4);
      },
    });
    if (flapRef.current) {
      tl.to(flapRef.current, { rotateX: -175, duration: 0.7, ease: 'power2.inOut' });
    }
    if (letterRef.current) {
      tl.to(
        letterRef.current,
        { y: -64, scale: 1.04, duration: 0.65, ease: 'power3.out' },
        '-=0.25'
      );
    }
  };

  const handleGiftUnwrap = () => {
    if (isAnimatingStage) return;
    if (prefersReducedMotion) {
      setStage(4);
      return;
    }
    setIsAnimatingStage(true);
    const tl = gsap.timeline({
      onComplete: () => {
        try {
          void confetti({
            particleCount: 85,
            spread: 72,
            origin: { y: 0.6 },
            colors: [accent, secondaryAccent, '#FFFFFF', '#F59E0B'],
          });
        } catch {
          // Ignore confetti errors in restricted headless environments
        }
        setIsAnimatingStage(false);
        setStage(4);
      },
    });
    if (giftLidRef.current) {
      tl.to(giftLidRef.current, {
        y: -85,
        rotate: -12,
        opacity: 0,
        duration: 0.65,
        ease: 'back.out(1.4)',
      });
    }
  };

  const handlePartCurtains = () => {
    if (isAnimatingStage) return;
    if (prefersReducedMotion) {
      setStage(4);
      return;
    }
    setIsAnimatingStage(true);
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimatingStage(false);
        setStage(4);
      },
    });
    if (curtainLeftRef.current && curtainRightRef.current) {
      tl.to(curtainLeftRef.current, { x: '-105%', duration: 0.75, ease: 'power3.inOut' })
        .to(curtainRightRef.current, { x: '105%', duration: 0.75, ease: 'power3.inOut' }, '<');
    }
  };

  const handleRsvpSubmit = async (selected: Exclude<RsvpStatus, 'none'>) => {
    setRsvpStatus(selected);
    setRsvpFeedback(null);

    if (isPreview || !token) {
      setRsvpFeedback(
        selected === 'accepted'
          ? 'Preview RSVP recorded: Yes, I will attend.'
          : selected === 'maybe'
          ? 'Preview RSVP recorded: Maybe.'
          : 'Preview RSVP recorded: Unable to attend.'
      );
      return;
    }

    setRsvpSaving(true);
    try {
      await submitGuestRsvp(token, selected, rsvpAttendees, rsvpMessage);
      setRsvpFeedback('Thank you! Your response has been shared with the host.');
    } catch {
      setRsvpFeedback('Could not save your response right now. Please try again.');
    } finally {
      setRsvpSaving(false);
    }
  };

  const fontClass =
    customization.fontChoice === 'sans'
      ? 'font-sans'
      : customization.fontChoice === 'playfair' || customization.fontChoice === 'cormorant'
      ? 'font-display'
      : 'font-display';

  const welcomeSubtitle =
    sequence === 'envelope-ribbon'
      ? 'With love, warmth, and blessings...'
      : sequence === 'gift-confetti'
      ? 'Get ready to celebrate!'
      : sequence === 'love-letter'
      ? 'A cherished milestone awaits...'
      : 'With warmth and auspicious blessings...';

  const primaryDateFormatted = formatDisplayDate(eventData.eventDate);
  const primaryTimeFormatted = formatDisplayTime(eventData.startTime);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: bg, color: primaryText }}
    >
      <PatternOverlay pattern={customization.pattern} color={secondaryAccent} />
      <FloatingParticles
        type={theme.particleType}
        accentColor={accent}
        secondaryColor={secondaryAccent}
        disabled={customization.reducedParticles || prefersReducedMotion}
      />

      {/* Top Subtle Utility Controls (Sound / Skip Intro / Exit Preview) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {customization.musicMood !== 'none' && (
          <button
            type="button"
            onClick={toggleMusic}
            aria-label={musicOn ? 'Mute ambient chime' : 'Play ambient chime'}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-transform hover:scale-105"
            style={{
              backgroundColor: `${cardBg}E6`,
              border: `1px solid ${borderColor}`,
              color: primaryText,
            }}
          >
            {musicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}
        {stage < 4 && (
          <button
            type="button"
            onClick={() => setStage(4)}
            className="px-4 py-2 rounded-lg text-xs font-medium shadow-md backdrop-blur-md whitespace-nowrap min-h-[42px] transition-opacity hover:opacity-90"
            style={{
              backgroundColor: `${cardBg}EB`,
              border: `1px solid ${borderColor}`,
              color: primaryText,
            }}
          >
            Skip Intro
          </button>
        )}
        {isPreview && onClosePreview && (
          <button
            type="button"
            onClick={onClosePreview}
            className="px-4 py-2 rounded-lg text-xs font-medium shadow-md bg-stone-900 text-white hover:bg-stone-800 whitespace-nowrap min-h-[42px] inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Preview</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* STAGE 1: PERSONALIZED WELCOME CURTAIN */}
        {stage === 1 && (
          <motion.section
            key="stage-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-screen flex items-center justify-center px-5 py-12 relative z-10"
          >
            <div
              className="relative w-full max-w-lg rounded-2xl p-8 sm:p-12 text-center shadow-2xl overflow-hidden"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              {/* Double Hairline Inset Stationery Frame */}
              <div
                className="pointer-events-none absolute inset-3 rounded-xl"
                style={{ border: `1px solid ${secondaryAccent}45` }}
                aria-hidden="true"
              />

              {customization.floralDecorations && (
                <CardCornerOrnaments
                  styleType={customization.ornamentStyle}
                  accentColor={accent}
                  secondaryColor={secondaryAccent}
                />
              )}

              {theme.previewImage && (
                <div
                  className="mx-auto mb-6 w-48 h-48 sm:w-52 sm:h-52 rounded-t-[110px] rounded-b-xl overflow-hidden shadow-md relative"
                  style={{ border: `2px solid ${secondaryAccent}88` }}
                >
                  <img
                    src={theme.previewImage}
                    alt={theme.themeName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p
                className="text-sm tracking-wide italic mb-3"
                style={{ color: secondaryText }}
              >
                {customGreeting || welcomeSubtitle}
              </p>

              <p
                className={`text-4xl sm:text-5xl mb-2 ${
                  customization.fontChoice === 'script-accent' ? 'font-script' : fontClass
                }`}
                style={{ color: accent }}
              >
                Dear {displayGuest}
              </p>

              <OrnamentalDivider accentColor={accent} secondaryColor={secondaryAccent} />

              <p className="text-base sm:text-lg mb-8" style={{ color: primaryText }}>
                You are warmly invited to our celebration
              </p>

              <button
                type="button"
                onClick={handleOpenStage1}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px] whitespace-nowrap"
                style={{ backgroundColor: accent }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Your Invitation</span>
              </button>
            </div>
          </motion.section>
        )}

        {/* STAGE 2: TACTILE REVEAL CEREMONY */}
        {stage === 2 && (
          <motion.section
            key="stage-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative z-10"
          >
            {/* ROLLED PARCHMENT SCROLL TIED WITH THREAD & YARN (Inspired by 3rd Reference Image) */}
            {sequence === 'envelope-ribbon' && (
              <div className="w-full max-w-xl text-center space-y-7">
                <div className="space-y-1.5">
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-medium"
                    style={{ color: canvasMuted }}
                  >
                    Royal Keepsake Scroll
                  </p>
                  <p className="text-sm sm:text-base" style={{ color: canvasText }}>
                    Untie the silk yarn around the scroll to unfold your invitation,{' '}
                    <span className="font-semibold" style={{ color: darkBg ? secondaryAccent : accent }}>
                      {displayGuest}
                    </span>
                  </p>
                </div>

                <div
                  onClick={handleUnrollScrollWithYarn}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleUnrollScrollWithYarn();
                    }
                  }}
                  aria-label="Untie thread and yarn to unroll invitation scroll"
                  className="relative mx-auto w-full max-w-md h-64 flex items-center justify-center cursor-pointer select-none group"
                >
                  {/* Unfolding Inner Parchment Sheet (reveals as scroll unrolls) */}
                  <div
                    ref={unrollSheetRef}
                    className="absolute inset-x-8 top-4 bottom-4 rounded-xl opacity-0 shadow-2xl flex flex-col items-center justify-center px-6"
                    style={{
                      backgroundColor: cardBg,
                      border: `1px solid ${secondaryAccent}`,
                      color: primaryText,
                    }}
                  >
                    <p className="text-xs italic" style={{ color: secondaryText }}>
                      For {displayGuest}
                    </p>
                    <h3 className={`text-2xl sm:text-3xl font-semibold mt-1 ${fontClass}`} style={{ color: accent }}>
                      {snapshot.eventTitle}
                    </h3>
                  </div>

                  {/* Rolled Cylinder Scroll + Thread & Yarn Assembly */}
                  <div
                    ref={scrollWrapRef}
                    className="relative w-full h-52 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]"
                  >
                    <div ref={scrollTubeRef} className="w-full h-full flex items-center justify-center">
                      <svg
                        viewBox="0 0 460 220"
                        className="w-full h-full drop-shadow-[0_22px_28px_rgba(0,0,0,0.45)]"
                        fill="none"
                      >
                        <defs>
                          {/* Cylindrical 3D parchment shading */}
                          <linearGradient id="scrollCylGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={cardBg} stopOpacity="0.92" />
                            <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.98" />
                            <stop offset="55%" stopColor={cardBg} stopOpacity="1" />
                            <stop offset="85%" stopColor="#D8CCB8" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#A99982" stopOpacity="0.95" />
                          </linearGradient>

                          {/* Inner hollow tube depth gradient (like 3rd image) */}
                          <radialGradient id="hollowCoreGrad" cx="45%" cy="50%" r="55%">
                            <stop offset="0%" stopColor="#1D120D" />
                            <stop offset="58%" stopColor="#4A3525" />
                            <stop offset="85%" stopColor="#8C735B" />
                            <stop offset="100%" stopColor="#C8B79E" />
                          </radialGradient>

                          {/* Braided yarn gradient */}
                          <linearGradient id="yarnGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={secondaryAccent} />
                            <stop offset="50%" stopColor={accent} />
                            <stop offset="100%" stopColor={secondaryAccent} />
                          </linearGradient>
                        </defs>

                        {/* Soft surface shadow beneath cylinder */}
                        <ellipse cx="236" cy="176" rx="178" ry="18" fill="rgba(0,0,0,0.32)" />

                        {/* Main Rolled Parchment Cylinder Body */}
                        <path
                          d="M78 48 L392 48 C416 48 424 162 392 162 L78 162 Z"
                          fill="url(#scrollCylGrad)"
                          stroke={`${secondaryAccent}AA`}
                          strokeWidth="1.2"
                        />

                        {/* Subtle vertical rolled sheet seam & gold border edge on the scroll */}
                        <path
                          d="M115 112 L398 112"
                          stroke="#B8A892"
                          strokeWidth="1"
                          strokeDasharray="2 0"
                          opacity="0.65"
                        />
                        <path
                          d="M115 113.5 L398 113.5"
                          stroke="#FFFFFF"
                          strokeWidth="0.8"
                          opacity="0.5"
                        />
                        {/* Decorative gold print band peeking along scroll */}
                        <path
                          d="M108 62 L388 62"
                          stroke={secondaryAccent}
                          strokeWidth="1"
                          opacity="0.45"
                        />
                        <path
                          d="M108 148 L388 148"
                          stroke={secondaryAccent}
                          strokeWidth="1"
                          opacity="0.45"
                        />

                        {/* Left Hollow Spiral Cylinder Opening (matching 3rd image perspective) */}
                        <ellipse
                          cx="78"
                          cy="105"
                          rx="34"
                          ry="57"
                          fill="url(#hollowCoreGrad)"
                          stroke={cardBg}
                          strokeWidth="5"
                        />
                        {/* Concentric rolled paper spiral layers inside the hollow tube */}
                        <path
                          d="M78 55 C57 55 48 78 48 105 C48 134 61 153 79 153 C97 153 107 132 107 106 C107 82 94 64 78 64 C64 64 56 83 56 105 C56 125 66 141 79 141 C91 141 98 125 98 106 C98 89 89 75 78 75 C69 75 64 89 64 105 C64 118 71 129 79 129"
                          stroke="#E7DCC9"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.92"
                        />

                        {/* Right Cylinder End Cap Rim */}
                        <path
                          d="M392 48 C416 48 424 162 392 162"
                          stroke={`${secondaryAccent}99`}
                          strokeWidth="1.5"
                          fill="none"
                        />

                        {/* THREAD & YARN WINDING AROUND THE SCROLL */}
                        <g ref={yarnCoilsRef}>
                          {/* Yarn drop shadow on paper */}
                          <path
                            d="M214 47 C225 78 225 132 214 163"
                            stroke="rgba(0,0,0,0.22)"
                            strokeWidth="7"
                            strokeLinecap="round"
                          />
                          <path
                            d="M232 47 C243 78 243 132 232 163"
                            stroke="rgba(0,0,0,0.22)"
                            strokeWidth="7"
                            strokeLinecap="round"
                          />
                          <path
                            d="M250 47 C261 78 261 132 250 163"
                            stroke="rgba(0,0,0,0.22)"
                            strokeWidth="7"
                            strokeLinecap="round"
                          />

                          {/* Wound yarn cord loops */}
                          <path
                            d="M212 46 C223 78 223 132 212 164"
                            stroke={accent}
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M212 46 C223 78 223 132 212 164"
                            stroke={secondaryAccent}
                            strokeWidth="1.8"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                          />

                          <path
                            d="M230 46 C241 78 241 132 230 164"
                            stroke={accent}
                            strokeWidth="5.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M230 46 C241 78 241 132 230 164"
                            stroke={secondaryAccent}
                            strokeWidth="2"
                            strokeDasharray="5 4"
                            strokeLinecap="round"
                          />

                          <path
                            d="M248 46 C259 78 259 132 248 164"
                            stroke={accent}
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M248 46 C259 78 259 132 248 164"
                            stroke={secondaryAccent}
                            strokeWidth="1.8"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                          />
                        </g>

                        {/* Dangling Yarn Tails */}
                        <path
                          ref={yarnTailLeftRef}
                          d="M232 114 C216 144 192 174 178 198"
                          stroke={accent}
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <path
                          ref={yarnTailRightRef}
                          d="M236 114 C252 146 276 176 292 198"
                          stroke={secondaryAccent}
                          strokeWidth="3.8"
                          strokeLinecap="round"
                        />

                        {/* Central Yarn Knot & Bow Charm */}
                        <g ref={yarnKnotRef}>
                          {/* Bow loops */}
                          <path
                            d="M233 105 C208 82 192 98 205 113 C214 122 228 112 233 105 Z"
                            fill="url(#yarnGrad)"
                            stroke={secondaryAccent}
                            strokeWidth="1.2"
                          />
                          <path
                            d="M235 105 C260 82 276 98 263 113 C254 122 240 112 235 105 Z"
                            fill="url(#yarnGrad)"
                            stroke={secondaryAccent}
                            strokeWidth="1.2"
                          />
                          {/* Wax / Gold Charm Seal at Knot Center */}
                          <circle
                            cx="234"
                            cy="107"
                            r="15"
                            fill={accent}
                            stroke={secondaryAccent}
                            strokeWidth="2"
                          />
                          <text
                            x="234"
                            y="112"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="14"
                            fontFamily="Cormorant Garamond, Georgia, serif"
                            fontWeight="700"
                          >
                            V
                          </text>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUnrollScrollWithYarn}
                  disabled={isAnimatingStage}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white shadow-xl min-h-[48px] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: accent }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnimatingStage ? 'Unrolling Scroll...' : 'Untie Yarn & Unroll'}</span>
                </button>
              </div>
            )}

            {/* LOVE LETTER ENVELOPE SEQUENCE (Anniversary / Baby Shower / Family Reunion) */}
            {sequence === 'love-letter' && (
              <div className="w-full max-w-md text-center space-y-6">
                <p className="text-sm font-medium" style={{ color: secondaryText }}>
                  A keepsake letter addressed to {displayGuest}
                </p>

                <div
                  onClick={handleEnvelopeOpen}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleEnvelopeOpen();
                    }
                  }}
                  className="relative mx-auto w-80 sm:w-96 h-56 cursor-pointer select-none"
                  style={{ perspective: '1200px' }}
                >
                  {/* Envelope Back */}
                  <div
                    className="absolute inset-0 rounded-xl shadow-2xl"
                    style={{
                      backgroundColor: theme.palette.envelopeColor,
                      border: `1px solid ${borderColor}`,
                    }}
                  />

                  {/* Sliding Letter Card inside */}
                  <div
                    ref={letterRef}
                    className="absolute left-4 right-4 top-5 bottom-4 rounded-lg p-5 flex flex-col items-center justify-center shadow-md"
                    style={{
                      backgroundColor: cardBg,
                      color: primaryText,
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <p className="text-xs tracking-wide" style={{ color: secondaryText }}>
                      For {displayGuest}
                    </p>
                    <h3 className={`text-2xl font-semibold mt-1 ${fontClass}`}>
                      {snapshot.eventTitle}
                    </h3>
                  </div>

                  {/* Clean SVG Envelope Front Pocket (zero corner artifacts) */}
                  <svg
                    viewBox="0 0 384 224"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
                  >
                    <polygon
                      points="0,0 192,126 0,224"
                      fill={theme.palette.envelopeColor}
                      opacity="0.96"
                    />
                    <polygon
                      points="384,0 192,126 384,224"
                      fill={theme.palette.envelopeColor}
                      opacity="0.92"
                    />
                    <polygon
                      points="0,224 192,110 384,224"
                      fill={theme.palette.envelopeColor}
                      stroke={`${secondaryAccent}66`}
                      strokeWidth="1"
                    />
                  </svg>

                  {/* Top Flap */}
                  <div
                    ref={flapRef}
                    className="absolute top-0 left-0 right-0 h-32 origin-top rounded-t-xl shadow-md"
                    style={{
                      backgroundColor: theme.palette.envelopeColor,
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      transformStyle: 'preserve-3d',
                    }}
                  />

                  {/* Embossed Wax Seal */}
                  <div
                    className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                    style={{
                      backgroundColor: accent,
                      border: `2px solid ${secondaryAccent}`,
                      color: '#FFFFFF',
                    }}
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnvelopeOpen}
                  disabled={isAnimatingStage}
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white shadow-md min-h-[44px]"
                  style={{ backgroundColor: accent }}
                >
                  Break Seal &amp; Read
                </button>
              </div>
            )}

            {/* GIFT BOX SEQUENCE (Birthday / Graduation / Farewell / Retirement) */}
            {sequence === 'gift-confetti' && (
              <div className="w-full max-w-md text-center space-y-6">
                <p className="text-sm font-medium" style={{ color: secondaryText }}>
                  A celebration surprise for {displayGuest}
                </p>

                <div
                  onClick={handleGiftUnwrap}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleGiftUnwrap();
                    }
                  }}
                  className="relative mx-auto w-64 h-64 cursor-pointer flex flex-col items-center justify-end pb-4"
                >
                  {/* Gift Lid */}
                  <div
                    ref={giftLidRef}
                    className="w-60 h-14 rounded-lg shadow-lg relative z-20 flex items-center justify-center"
                    style={{
                      backgroundColor: accent,
                      border: `2px solid ${secondaryAccent}`,
                    }}
                  >
                    <div
                      className="w-10 h-full"
                      style={{ backgroundColor: secondaryAccent }}
                    />
                    <Gift className="w-7 h-7 text-white absolute -top-7" />
                  </div>
                  {/* Gift Box Body */}
                  <div
                    className="w-52 h-40 rounded-b-xl shadow-2xl relative z-10 flex items-center justify-center"
                    style={{
                      backgroundColor: cardBg,
                      border: `2px solid ${accent}`,
                    }}
                  >
                    <div
                      className="w-10 h-full absolute inset-y-0"
                      style={{ backgroundColor: accent }}
                    />
                    <div
                      className="h-8 w-full absolute inset-x-0"
                      style={{ backgroundColor: secondaryAccent, opacity: 0.9 }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGiftUnwrap}
                  disabled={isAnimatingStage}
                  className="px-7 py-3.5 rounded-full text-sm font-semibold text-white shadow-lg min-h-[48px]"
                  style={{ backgroundColor: accent }}
                >
                  Unwrap Your Invite
                </button>
              </div>
            )}

            {/* MANDALA / TORAN CURTAIN SEQUENCE (Puja / Housewarming / Corporate / Custom) */}
            {sequence === 'mandala-curtain' && (
              <div className="w-full max-w-md text-center space-y-6">
                <div
                  className="relative mx-auto w-full h-80 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="p-6 text-center">
                    <p className="text-xs tracking-wide" style={{ color: secondaryText }}>
                      For {displayGuest}
                    </p>
                    <h3 className={`text-3xl font-semibold mt-2 ${fontClass}`}>
                      {snapshot.eventTitle}
                    </h3>
                  </div>

                  {/* Left Curtain */}
                  <div
                    ref={curtainLeftRef}
                    className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-end pr-2 shadow-xl"
                    style={{
                      backgroundColor: accent,
                      borderRight: `2px solid ${secondaryAccent}`,
                    }}
                  />
                  {/* Right Curtain */}
                  <div
                    ref={curtainRightRef}
                    className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-start pl-2 shadow-xl"
                    style={{
                      backgroundColor: accent,
                      borderLeft: `2px solid ${secondaryAccent}`,
                    }}
                  />

                  <button
                    type="button"
                    onClick={handlePartCurtains}
                    className="relative z-20 px-6 py-3 rounded-full text-sm font-semibold shadow-xl min-h-[48px]"
                    style={{
                      backgroundColor: cardBg,
                      color: primaryText,
                      border: `2px solid ${secondaryAccent}`,
                    }}
                  >
                    Reveal Invitation
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* STAGE 4: UNIFIED FOLDED INVITATION PAGE (01 Invitation, 02 Pre-Wedding, 03 Schedule & Map, 04 RSVP) */}
        {stage === 4 && (
          <motion.main
            key="stage-4"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, rotateX: -6, y: 24, scale: 0.98 }
            }
            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6"
            style={{ perspective: '1400px' }}
          >
            <section
              className="relative rounded-2xl p-6 sm:p-11 shadow-2xl overflow-hidden space-y-12"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              {/* Subtle Paper Fold Crease Shadow (Evokes a folded stationery sheet) */}
              <div
                className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 opacity-35"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.035) 50%, transparent 100%)',
                }}
              />

              {/* Double Hairline Inset Frame */}
              <div
                className="pointer-events-none absolute inset-3 rounded-xl"
                style={{ border: `1px solid ${secondaryAccent}40` }}
                aria-hidden="true"
              />

              {customization.floralDecorations && (
                <CardCornerOrnaments
                  styleType={customization.ornamentStyle}
                  accentColor={accent}
                  secondaryColor={secondaryAccent}
                />
              )}

              {/* 01 · INVITATION */}
              <div className="relative z-10 text-center space-y-6">
                <p
                  className="text-[11px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: secondaryText }}
                >
                  01 · Invitation
                </p>

                {theme.previewImage && (
                  <div
                    className="mx-auto max-w-md h-48 sm:h-56 rounded-xl overflow-hidden shadow-md relative"
                    style={{ border: `1px solid ${secondaryAccent}88` }}
                  >
                    <img
                      src={theme.previewImage}
                      alt={theme.themeName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm italic" style={{ color: secondaryText }}>
                    {customGreeting || `With warmth for ${displayGuest}`}
                  </p>

                  {snapshot.categorySlug === 'wedding' &&
                  (eventData.brideName || eventData.groomName) ? (
                    <div className="space-y-2 pt-1">
                      <h1
                        className={`text-4xl sm:text-6xl font-semibold tracking-tight leading-tight ${
                          customization.fontChoice === 'script-accent'
                            ? 'font-script'
                            : fontClass
                        }`}
                        style={{ color: accent }}
                      >
                        {eventData.brideName || 'Bride'} &amp;{' '}
                        {eventData.groomName || 'Groom'}
                      </h1>
                      {eventData.familyNames && (
                        <p className="text-sm" style={{ color: secondaryText }}>
                          Together with {eventData.familyNames}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <h1
                        className={`text-3xl sm:text-5xl font-semibold tracking-tight leading-tight ${fontClass}`}
                        style={{ color: accent }}
                      >
                        {snapshot.eventTitle}
                      </h1>
                      {(eventData.honoreeName || eventData.coupleNames) && (
                        <p
                          className={`text-2xl sm:text-3xl ${
                            customization.fontChoice === 'script-accent'
                              ? 'font-script'
                              : fontClass
                          }`}
                          style={{ color: primaryText }}
                        >
                          {eventData.honoreeName || eventData.coupleNames}
                          {eventData.ageOrMilestone ? ` · ${eventData.ageOrMilestone}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <OrnamentalDivider
                  accentColor={accent}
                  secondaryColor={secondaryAccent}
                />

                {snapshot.invitationMessage && (
                  <p
                    className="max-w-xl mx-auto text-base sm:text-lg leading-relaxed whitespace-pre-line"
                    style={{ color: primaryText }}
                  >
                    {snapshot.invitationMessage}
                  </p>
                )}

                {/* Primary Date, Time, Venue Strip */}
                <div
                  className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left sm:text-center"
                  style={{ borderTop: `1px solid ${borderColor}` }}
                >
                  <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1">
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="text-xs" style={{ color: secondaryText }}>
                        Date
                      </p>
                      <p className="text-sm font-medium">{primaryDateFormatted}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1">
                    <Clock className="w-4 h-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="text-xs" style={{ color: secondaryText }}>
                        Time
                      </p>
                      <p className="text-sm font-medium tabular-nums">
                        {primaryTimeFormatted || 'Evening Celebration'}
                        {eventData.endTime ? ` – ${formatDisplayTime(eventData.endTime)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="text-xs" style={{ color: secondaryText }}>
                        Venue
                      </p>
                      <p className="text-sm font-medium">
                        {eventData.primaryVenue ||
                          schedules[0]?.location?.venueName ||
                          'Venue details below'}
                      </p>
                    </div>
                  </div>
                </div>

                {(eventData.hostName || eventData.dressCode || eventData.contactInfo) && (
                  <div
                    className="pt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
                    style={{ borderTop: `1px solid ${borderColor}`, color: secondaryText }}
                  >
                    {eventData.hostName && <span>Hosted by {eventData.hostName}</span>}
                    {eventData.dressCode && <span>Attire: {eventData.dressCode}</span>}
                    {eventData.contactInfo && <span>Contact: {eventData.contactInfo}</span>}
                  </div>
                )}

                {settings.countdownEnabled && eventData.eventDate && (
                  <div className="pt-5" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <p
                      className="text-xs uppercase tracking-[0.16em] mb-3"
                      style={{ color: secondaryText }}
                    >
                      Counting Down to the Celebration
                    </p>
                    <CountdownTimer
                      eventDate={eventData.eventDate}
                      startTime={eventData.startTime}
                      accentColor={accent}
                      cardSurface={cardBg}
                      primaryText={primaryText}
                      secondaryText={secondaryText}
                      borderColor={borderColor}
                    />
                  </div>
                )}
              </div>

              {/* 02 · PRE-WEDDING / PHOTO GALLERY (HORIZONTAL DISPLAY) */}
              {settings.galleryEnabled && images.length > 0 && (
                <div
                  className="relative z-10 pt-10 space-y-6"
                  style={{ borderTop: `1px solid ${borderColor}` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p
                        className="text-[11px] font-mono uppercase tracking-[0.2em]"
                        style={{ color: secondaryText }}
                      >
                        02 ·{' '}
                        {snapshot.categorySlug === 'wedding' ||
                        snapshot.categorySlug === 'engagement'
                          ? 'Pre-Wedding'
                          : 'Captured Moments'}
                      </p>
                      <h2 className={`text-3xl sm:text-4xl font-semibold mt-1 ${fontClass}`}>
                        {snapshot.categorySlug === 'wedding' ||
                        snapshot.categorySlug === 'engagement'
                          ? 'Pre-Wedding Gallery'
                          : 'Photo Keepsakes'}
                      </h2>
                    </div>

                    {images.length > 1 && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => scrollGalleryHorizontally(-1)}
                          aria-label="Scroll photographs left"
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                          style={{
                            border: `1px solid ${borderColor}`,
                            color: primaryText,
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollGalleryHorizontally(1)}
                          aria-label="Scroll photographs right"
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                          style={{
                            border: `1px solid ${borderColor}`,
                            color: primaryText,
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Panoramic Gallery Strip */}
                  <div
                    ref={horizontalGalleryRef}
                    className="flex flex-row gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3"
                  >
                    {images.map((img, idx) => (
                      <figure
                        key={img.id}
                        className="snap-start shrink-0 w-[85%] sm:w-[340px] flex flex-col"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActivePhotoIndex(idx);
                            setLightboxOpen(true);
                          }}
                          className="group relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-md cursor-zoom-in"
                          style={{
                            border: `1px solid ${borderColor}`,
                            backgroundColor: inputBg,
                          }}
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.caption || `Pre-wedding photograph ${idx + 1}`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                          <span className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Expand className="w-3.5 h-3.5" />
                          </span>
                        </button>
                        <figcaption
                          className="mt-2.5 text-xs italic flex items-center justify-between gap-2"
                          style={{ color: secondaryText }}
                        >
                          <span className="truncate">
                            {img.caption || `Pre-Wedding Portrait ${idx + 1}`}
                          </span>
                          <span className="font-mono tabular-nums not-italic text-[11px] shrink-0">
                            0{idx + 1} / 0{images.length}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              {/* 03 · SCHEDULE & MAP */}
              {settings.locationsEnabled && schedules.length > 0 && (
                <div
                  className="relative z-10 pt-10 space-y-6"
                  style={{ borderTop: `1px solid ${borderColor}` }}
                >
                  <div className="text-center space-y-1">
                    <p
                      className="text-[11px] font-mono uppercase tracking-[0.2em]"
                      style={{ color: secondaryText }}
                    >
                      03 · Schedule &amp; Map
                    </p>
                    <h2 className={`text-3xl sm:text-4xl font-semibold ${fontClass}`}>
                      Ceremonies &amp; Venues
                    </h2>
                  </div>

                  <VenueMapView
                    schedules={schedules}
                    accentColor={accent}
                    cardSurface={cardBg}
                    primaryText={primaryText}
                    secondaryText={secondaryText}
                    borderColor={borderColor}
                  />
                </div>
              )}

              {/* 04 · RSVP */}
              {settings.rsvpEnabled && (
                <div
                  className="relative z-10 pt-10 space-y-6"
                  style={{ borderTop: `1px solid ${borderColor}` }}
                >
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center space-y-1.5">
                      <p
                        className="text-[11px] font-mono uppercase tracking-[0.2em]"
                        style={{ color: secondaryText }}
                      >
                        04 · RSVP
                      </p>
                      <h2 className={`text-3xl sm:text-4xl font-semibold ${fontClass}`}>
                        Kindly Respond
                      </h2>
                      <p className="text-sm" style={{ color: secondaryText }}>
                        Let us know if you will be joining us, {displayGuest}.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: secondaryText }}
                        >
                          Number of Attendees
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={rsvpAttendees}
                          onChange={(e) =>
                            setRsvpAttendees(
                              Math.min(
                                20,
                                Math.max(1, Number.parseInt(e.target.value || '1', 10))
                              )
                            )
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono font-medium tabular-nums focus:outline-none"
                          style={{
                            backgroundColor: inputBg,
                            color: primaryText,
                            border: `1px solid ${borderColor}`,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: secondaryText }}
                        >
                          Note for the Host (Optional)
                        </label>
                        <input
                          type="text"
                          value={rsvpMessage}
                          maxLength={500}
                          onChange={(e) => setRsvpMessage(e.target.value)}
                          placeholder="Warm wishes or dietary note..."
                          className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none"
                          style={{
                            backgroundColor: inputBg,
                            color: primaryText,
                            border: `1px solid ${borderColor}`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <button
                        type="button"
                        disabled={rsvpSaving}
                        onClick={() => void handleRsvpSubmit('accepted')}
                        className="py-3 px-4 rounded-xl text-sm font-semibold min-h-[48px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        style={{
                          backgroundColor: rsvpStatus === 'accepted' ? accent : 'transparent',
                          color: rsvpStatus === 'accepted' ? '#FFFFFF' : primaryText,
                          border: `1px solid ${rsvpStatus === 'accepted' ? accent : borderColor}`,
                        }}
                      >
                        {rsvpStatus === 'accepted' && <Check className="w-4 h-4" />}
                        <span>Yes, I&apos;ll attend</span>
                      </button>
                      <button
                        type="button"
                        disabled={rsvpSaving}
                        onClick={() => void handleRsvpSubmit('maybe')}
                        className="py-3 px-4 rounded-xl text-sm font-semibold min-h-[48px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        style={{
                          backgroundColor: rsvpStatus === 'maybe' ? accent : 'transparent',
                          color: rsvpStatus === 'maybe' ? '#FFFFFF' : primaryText,
                          border: `1px solid ${rsvpStatus === 'maybe' ? accent : borderColor}`,
                        }}
                      >
                        {rsvpStatus === 'maybe' && <Check className="w-4 h-4" />}
                        <span>Maybe</span>
                      </button>
                      <button
                        type="button"
                        disabled={rsvpSaving}
                        onClick={() => void handleRsvpSubmit('declined')}
                        className="py-3 px-4 rounded-xl text-sm font-semibold min-h-[48px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        style={{
                          backgroundColor: rsvpStatus === 'declined' ? accent : 'transparent',
                          color: rsvpStatus === 'declined' ? '#FFFFFF' : primaryText,
                          border: `1px solid ${rsvpStatus === 'declined' ? accent : borderColor}`,
                        }}
                      >
                        {rsvpStatus === 'declined' && <Check className="w-4 h-4" />}
                        <span>Sorry, I can&apos;t attend</span>
                      </button>
                    </div>

                    {rsvpFeedback && (
                      <p className="text-center text-sm font-medium pt-1" style={{ color: accent }}>
                        {rsvpFeedback}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Closing Benediction */}
            <footer className="text-center py-2 space-y-1">
              <p
                className={`text-lg sm:text-xl italic ${fontClass}`}
                style={{ color: canvasText }}
              >
                Your presence will make our celebration even more special.
              </p>
              <p className="text-xs opacity-80" style={{ color: canvasMuted }}>
                Personalized invitation for {displayGuest}
              </p>
            </footer>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen gallery"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={images[activePhotoIndex]?.imageUrl}
            alt={images[activePhotoIndex]?.caption || 'Fullscreen photo'}
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setActivePhotoIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setActivePhotoIndex((prev) => (prev + 1) % images.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
