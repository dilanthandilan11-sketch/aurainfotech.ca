"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// ── Client-only 3D imports ──────────────────────────────────────────────────
const LandingIntro = dynamic(
  () => import("@/components/scene/LandingIntro"),
  { ssr: false }
);

const Scene = dynamic(
  () => import("@/components/scene/Scene"),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100vw", height: "100vh", background: "#020204" }} />
    ),
  }
);

const AuraScrollPage = dynamic(
  () => import("@/components/scene/AuraScrollPage"),
  { ssr: false }
);

// ── Constants ───────────────────────────────────────────────────────────────
// Scrolling stops at the Capabilities section — there's nothing after it.
const MAX_PROGRESS    = 0.82;
const TOTAL_HEIGHT_VH = 450 * MAX_PROGRESS;
const UNFREEZE_DELAY  = 6000;

// Phase boundaries — scroll snaps to the nearest one when scrolling stops
const PHASE_STOPS = [0.00, 0.10, 0.25, 0.45, 0.65, MAX_PROGRESS];

export default function Home() {
  const [freeze, setFreeze]               = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const targetProgress  = useRef(0);
  const currentProgress = useRef(0);
  const rafRef          = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setFreeze(false);
      document.documentElement.classList.add("scroll-enabled");
    }, UNFREEZE_DELAY);
    return () => clearTimeout(t);
  }, []);

  // Smooth scroll progress + phase-snap when scrolling stops
  useEffect(() => {
    const dir      = { current: 1 };
    const lastY    = { current: window.scrollY };
    const snapping = { current: false };
    const snapRaf  = { current: null };
    const snapTimer = { current: null };

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const animateSnap = (targetP) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const startY = window.scrollY;
      const endY   = (targetP / MAX_PROGRESS) * maxScroll;
      if (Math.abs(endY - startY) < 10) { snapping.current = false; return; }

      snapping.current = true;
      const duration = 700;
      const t0 = performance.now();

      const step = (now) => {
        const t = Math.min((now - t0) / duration, 1);
        window.scrollTo(0, startY + (endY - startY) * easeOutQuart(t));
        if (t < 1) snapRaf.current = requestAnimationFrame(step);
        else        snapping.current = false;
      };
      snapRaf.current = requestAnimationFrame(step);
    };

    const checkSnap = () => {
      if (snapping.current) return;
      const cur  = targetProgress.current;
      const prev = [...PHASE_STOPS].reverse().find((p) => p <= cur + 0.001) ?? 0;
      const next = PHASE_STOPS.find((p) => p > cur + 0.001) ?? MAX_PROGRESS;
      if (Math.abs(next - prev) < 0.001) return;

      const pos    = (cur - prev) / (next - prev);
      const target = dir.current >= 0
        ? (pos > 0.20 ? next : prev)
        : (pos < 0.80 ? prev : next);

      if (Math.abs(target - cur) > 0.004) animateSnap(target);
    };

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const y = window.scrollY;
      targetProgress.current = Math.min(y / maxScroll, 1) * MAX_PROGRESS;

      if (snapping.current) { lastY.current = y; return; }

      if (y !== lastY.current) dir.current = y > lastY.current ? 1 : -1;
      lastY.current = y;
      clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(checkSnap, 260);
    };

    const tick = () => {
      const diff = targetProgress.current - currentProgress.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgress.current += diff * 0.07;
        setScrollProgress(currentProgress.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current)    cancelAnimationFrame(rafRef.current);
      if (snapRaf.current)   cancelAnimationFrame(snapRaf.current);
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, []);

  return (
    <main>
      {/*
       * Scroll spacer — MUST live outside LandingIntro.
       * LandingIntro renders position:fixed so anything inside it
       * is out of the document flow and can't drive scrollHeight.
       * This div sits in normal flow and gives the page its full
       * scroll height; the fixed AuraScrollPage viewport reacts to
       * the scroll events captured above.
       */}
      <div aria-hidden="true" style={{ height: `${TOTAL_HEIGHT_VH}vh` }} />

      {/* LandingIntro is position:fixed — pass totalHeight={0} so
          AuraScrollPage skips its own internal spacer */}
      <LandingIntro>
        <AuraScrollPage
          SceneComponent={Scene}
          scrollProgress={scrollProgress}
          freeze={freeze}
          totalHeight={0}
        />
      </LandingIntro>
    </main>
  );
}
