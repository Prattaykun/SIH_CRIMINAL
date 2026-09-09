'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const SPLASH_SRC = '/Cinematic_macro_close_up_view.mp4';
const FADE_MS = 700;
const MAX_MS = 14_000;

/**
 * Full-screen cinematic splash after a successful login.
 * Circular dark vignette keeps focus on the center of the frame.
 */
export function LoginSplashOverlay() {
  const { loginSplashPending, completeLoginSplash } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishingRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setVisible(false);
    window.setTimeout(() => {
      completeLoginSplash();
      setMounted(false);
      finishingRef.current = false;
    }, FADE_MS);
  }, [completeLoginSplash]);

  useEffect(() => {
    if (!loginSplashPending) return;

    finishingRef.current = false;
    setMounted(true);
    const showId = window.requestAnimationFrame(() => setVisible(true));
    const failSafe = window.setTimeout(finish, MAX_MS);

    return () => {
      window.cancelAnimationFrame(showId);
      window.clearTimeout(failSafe);
    };
  }, [loginSplashPending, finish]);

  useEffect(() => {
    if (!mounted || !visible) return;
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const playAttempt = video.play();
    if (playAttempt) {
      playAttempt.catch(() => {
        // Autoplay blocked — still show frame, fail-safe will dismiss.
      });
    }
  }, [mounted, visible]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted && !loginSplashPending) return null;
  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome splash"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={SPLASH_SRC}
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />

      {/* Circular dark hue — bright center, darkened rim */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 48% 52% at 50% 50%, transparent 0%, transparent 28%, rgba(0,0,0,0.35) 52%, rgba(0,0,0,0.78) 72%, rgba(0,0,0,0.96) 88%, #000 100%)',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.04]"
      />

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 right-8 z-10 rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:bg-black/70 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}
