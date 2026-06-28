"use client"

import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// CONFIGURATION
// ============================================
const INTRO_DELAY = 7000;
const CYCLING_WORDS = ["Vitality", "Intelligence", "Energy", "Resonance", "Evolution"];
const WORD_CYCLE_INTERVAL = 4000;

const TAGLINE_ITEMS = [
  { icon: "⊞", label: "Software Development" },
  { icon: "⬡", label: "Web Development" },
  { icon: "⬈", label: "Digital Marketing" },
  { icon: "◈", label: "Graphic Designing" },
  { icon: "▣", label: "UI/UX Designing" },
  { icon: "◎", label: "SEO" },
  { icon: "▤", label: "Analytics & Data Analysis" },
];

const CONTACT_ITEMS = [
  { icon: "☏", label: "Phone",     value: "+1 (437) 980-3393" },
  { icon: "✉", label: "Email",     value: "contact@aurainfotech.ca" },
  { icon: "⊕", label: "Website",   value: "www.aurainfotech.ca" },
  { icon: "❖", label: "Facebook",  value: "Aura InfoTech" },
  { icon: "◍", label: "Instagram", value: "aurainfotech.ca" },
];

// ============================================
// EASING
// ============================================
function customEase(t) {
  return t < 0.5 ? 2 * t * t * (1.5 - t) : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================
// FLIP CHARACTER
// ============================================
function FlipCharacterEnter({ char, index, isVisible, staggerDelay = 100, duration = 600, startDelay = 0 }) {
  const [progress, setProgress] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      startTimeRef.current = null;
      return;
    }

    const totalDelay = startDelay + index * staggerDelay;

    const timeout = setTimeout(() => {
      startTimeRef.current = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const rawProgress = Math.min(1, elapsed / duration);
        setProgress(rawProgress);

        if (rawProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, totalDelay);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isVisible, index, staggerDelay, duration, startDelay]);

  const easedProgress = customEase(progress);
  const rotateX = 90 * (1 - easedProgress);
  const y = 20 * (1 - easedProgress);
  const blur = 8 * (1 - easedProgress);
  const opacity = easedProgress;

  return (
    <span
      style={{
        display: "inline-block",
        transformStyle: "preserve-3d",
        transform: `rotateX(${rotateX}deg) translateY(${y}px)`,
        filter: blur > 0.1 ? `blur(${blur}px)` : "none",
        opacity,
        willChange: progress > 0 && progress < 1 ? "transform, opacity, filter" : "auto",
      }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  );
}

// ============================================
// FLIP TEXT
// ============================================
function FlipText({ text, isVisible, startDelay = 0, staggerDelay = 100, charDuration = 600, style = {} }) {
  const characters = useMemo(() => text.split(""), [text]);

  return (
    <span style={{ display: "inline-flex", gap: "0.02em", perspective: "1000px", ...style }}>
      {characters.map((char, i) => (
        <FlipCharacterEnter
          key={`${char}-${i}`}
          char={char}
          index={i}
          isVisible={isVisible}
          staggerDelay={staggerDelay}
          duration={charDuration}
          startDelay={startDelay}
        />
      ))}
    </span>
  );
}

// ============================================
// ELEMENT REVEAL
// ============================================
function ElementReveal({ children, startDelay = 0, duration = 600, isVisible = false, style = {} }) {
  const [progress, setProgress] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const timeout = setTimeout(() => {
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const rawProgress = Math.min(1, elapsed / duration);
        setProgress(customEase(rawProgress));

        if (rawProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isVisible, startDelay, duration]);

  const rotateX = 45 * (1 - progress);
  const y = 15 * (1 - progress);
  const blur = 6 * (1 - progress);
  const opacity = progress;

  return (
    <div
      style={{
        ...style,
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotateX}deg) translateY(${y}px)`,
        filter: blur > 0.1 ? `blur(${blur}px)` : "none",
        opacity,
        willChange: progress > 0 && progress < 1 ? "transform, opacity, filter" : "auto",
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// FLIP FADE CYCLER
// ============================================
const FlipFadeLetter = memo(function FlipFadeLetter({ char, letterDuration }) {
  return (
    <motion.span
      style={{ transformStyle: "preserve-3d", display: "inline-block" }}
      variants={{
        initial: { rotateX: 90, y: 20, opacity: 0, filter: "blur(8px)" },
        animate: {
          rotateX: 0,
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: letterDuration, ease: [0.2, 0.65, 0.3, 0.9] },
        },
        exit: {
          rotateX: -90,
          y: -20,
          opacity: 0,
          filter: "blur(8px)",
          transition: { duration: letterDuration * 0.67, ease: "easeIn" },
        },
      }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
});

const FlipFadeWord = memo(function FlipFadeWord({ text, staggerDelay, exitStaggerDelay, letterDuration, style }) {
  const letters = useMemo(() => text.split(""), [text]);

  return (
    <motion.div
      style={{ display: "inline-flex", gap: "0.02em", transformStyle: "preserve-3d", ...style }}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 1 },
        animate: { opacity: 1, transition: { staggerChildren: staggerDelay } },
        exit: { opacity: 1, transition: { staggerChildren: exitStaggerDelay } },
      }}
    >
      {letters.map((char, i) => (
        <FlipFadeLetter key={`${text}-${i}`} char={char} letterDuration={letterDuration} />
      ))}
    </motion.div>
  );
});

function FlipFadeCycler({ words, interval = 4000, isActive, initialDelay = 0, letterDuration = 0.6, staggerDelay = 0.08, exitStaggerDelay = 0.05, style = {} }) {
  const [index, setIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIndex(0);
      setHasEntered(false);
      return;
    }

    let enterTimer = null;
    let cycleTimer = null;

    enterTimer = setTimeout(() => {
      setHasEntered(true);

      const enterTimeMs = letterDuration * 1000 + words[0].length * staggerDelay * 1000 + 150;

      cycleTimer = setTimeout(() => {
        const loop = setInterval(() => {
          setIndex((prev) => (prev + 1) % words.length);
        }, interval);
        cycleTimer = loop;
      }, enterTimeMs);
    }, initialDelay);

    return () => {
      if (enterTimer) clearTimeout(enterTimer);
      if (cycleTimer) {
        clearTimeout(cycleTimer);
        clearInterval(cycleTimer);
      }
    };
  }, [isActive, initialDelay, interval, words, letterDuration, staggerDelay]);

  const currentWord = useMemo(() => words[index], [words, index]);

  if (!hasEntered) return <span style={{ ...style, opacity: 0 }}>{words[0]}</span>;

  return (
    <span style={{ display: "inline-flex", perspective: "1000px" }}>
      <AnimatePresence mode="wait">
        <FlipFadeWord
          key={currentWord}
          text={currentWord}
          staggerDelay={staggerDelay}
          exitStaggerDelay={exitStaggerDelay}
          letterDuration={letterDuration}
          style={style}
        />
      </AnimatePresence>
    </span>
  );
}

// ============================================
// RESPONSIVE STYLES — desktop-only tweaks injected once
// ============================================
function ResponsiveStyles() {
  useEffect(() => {
    const id = "scene-text-responsive-styles";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .aura-contact-panel { display: none; }

      @media (min-width: 1200px) {
        .aura-tagline-row {
          flex-wrap: nowrap !important;
          gap: 5px 16px !important;
          font-size: 0.8rem !important;
          letter-spacing: 0.04em !important;
          max-width: 1500px !important;
          width: 95% !important;
        }
        .aura-contact-panel { display: flex; }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById(id)?.remove();
  }, []);

  return null;
}

// ============================================
// MAIN COMPONENT (NO NAVBAR - moved to Navbar.jsx)
// ============================================
export default function SceneText({ scrollProgress = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), INTRO_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const TIMING = {
    LOGO: 0,
    HEADLINE_1: 200,
    HEADLINE_2: 700,
    HEADLINE_3: 1200,
    SUBHEADLINE: 1800,
    SERVICES: 2300,
  };

  // Phase-based fade aligned with system activation:
  // Phase 0 (0.00-0.15): Text fully visible - dormant state
  // Phase 1 (0.15-0.35): Text fades out during core activation
  // Phase 2+ (0.35+): Text fully gone - system active
  const fadeStart = 0.15;
  const fadeEnd = 0.35;
  const fadeProgress = scrollProgress < fadeStart
    ? 0
    : Math.min(1, (scrollProgress - fadeStart) / (fadeEnd - fadeStart));
  const opacity = 1 - fadeProgress;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.15s ease-out",
      }}
    >
      <ResponsiveStyles />

      {/* TOP LEFT LOGO */}
      <ElementReveal
        isVisible={isVisible}
        startDelay={TIMING.LOGO}
        duration={700}
        style={{
          position: "absolute",
          top: "25px",
          left: "35px",
          pointerEvents: "none",
        }}
      >
        <img
          src="/logo.png"
          alt="Aura Infotech"
          style={{
            marginTop: "-25px",
            height: "90px",
            width: "auto",
            objectFit: "contain",
          }}
        />
      </ElementReveal>

      {/* MAIN HEADLINE */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "5%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          maxWidth: "500px",
        }}
      >
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
            fontWeight: 300,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: "0.02em",
          }}
        >
          <FlipText
            text="Synthesizing"
            isVisible={isVisible}
            startDelay={TIMING.HEADLINE_1}
            staggerDelay={70}
            charDuration={550}
          />
        </h1>

        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
            fontWeight: 300,
            color: "#ffffff",
            margin: "0.15em 0",
            lineHeight: 1.15,
            letterSpacing: "0.02em",
          }}
        >
          <FlipText
            text="Algorithmic"
            isVisible={isVisible}
            startDelay={TIMING.HEADLINE_2}
            staggerDelay={65}
            charDuration={520}
          />
        </h1>

        <h1
          style={{
            margin: "0.15em 0",
            lineHeight: 1.15,
            minWidth: "360px",
          }}
        >
          <FlipFadeCycler
            words={CYCLING_WORDS}
            interval={WORD_CYCLE_INTERVAL}
            isActive={isVisible}
            initialDelay={TIMING.HEADLINE_3}
            letterDuration={0.6}
            staggerDelay={0.08}
            exitStaggerDelay={0.05}
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
              fontWeight: 900,
              color: "#00d4ff",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              textShadow:
                "0 0 15px rgba(0, 212, 255, 0.9), 0 0 35px rgba(0, 212, 255, 0.55), 0 0 70px rgba(0, 212, 255, 0.25)",
            }}
          />
        </h1>

        <p
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: "20px",
            fontWeight: 100,
            color: "rgba(255, 255, 255, 0.95)",
            marginTop: "25px",
            letterSpacing: "0.04em",
          }}
        >
          <FlipText
            text="Where advanced systems meet real-world impact"
            isVisible={isVisible}
            startDelay={TIMING.SUBHEADLINE}
            staggerDelay={30}
            charDuration={400}
          />
        </p>
      </div>

      {/* BOTTOM SERVICES */}
      <ElementReveal
        isVisible={isVisible}
        startDelay={TIMING.SERVICES}
        duration={900}
        style={{
          position: "absolute",
          bottom: "35px",
          left: 0,
          right: 0,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="aura-tagline-row"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px 22px",
            fontFamily: "'Raleway', sans-serif",
            fontSize: "clamp(0.65rem, 2.6vw, 1rem)",
            fontWeight: 200,
            color: "rgba(255, 255, 255, 0.85)",
            letterSpacing: "0.08em",
            lineHeight: 1.8,
            textAlign: "center",
            maxWidth: "1300px",
            width: "92%",
          }}
        >
          {TAGLINE_ITEMS.map((item) => (
            <span
              key={item.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{ color: "#00d4ff", fontSize: "0.95em", lineHeight: 1 }}
              >
                {item.icon}
              </span>
              {item.label}
            </span>
          ))}
        </div>
      </ElementReveal>

      {/* RIGHT SIDE CONTACT PANEL — desktop only */}
      <ElementReveal
        isVisible={isVisible}
        startDelay={TIMING.SERVICES}
        duration={900}
        style={{
          position: "absolute",
          top: "50%",
          right: "5%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <div
          className="aura-contact-panel"
          style={{
            flexDirection: "column",
            gap: "18px",
            padding: "28px 32px",
            borderRadius: "16px",
            border: "1px solid rgba(0,212,255,0.18)",
            background: "linear-gradient(155deg, rgba(13,14,31,0.55) 0%, rgba(8,9,17,0.45) 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            minWidth: "260px",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.32em",
              color: "#00d4ff",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            Get In Touch
          </div>

          {CONTACT_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: "14px" }}
            >
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.22)",
                  color: "#00d4ff",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 300,
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ElementReveal>
    </div>
  );
}