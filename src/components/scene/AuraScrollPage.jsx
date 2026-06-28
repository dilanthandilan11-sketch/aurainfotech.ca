"use client";

/**
 * AuraScrollPage.jsx
 * ==================
 * Scroll orchestrator for the Aura Infotech hero narrative.
 * The 3D particle animation (StarfieldWithHands) and artifact scale/material
 * animations live in Scene.jsx / Artifact.jsx / StarfieldWithHands.jsx and
 * are driven by the scrollProgress prop passed here from page.js.
 *
 * This file owns:
 *   - The scroll spacer (sets page height to totalHeight vh)
 *   - The fixed viewport wrapper that keeps Scene pinned while scrolling
 *   - HTML/CSS ServicesSection (Phase 4: 0.65–0.82, holds at full opacity after)
 *   - UI chrome: AuroraOverlay, SectionLabel, ProgressDots, ScrollIndicator
 *
 * Scrolling stops at the Capabilities section (sp caps at 0.82 in page.js) —
 * there is no further content after it.
 */

import React, { useEffect, useRef, useState, memo } from "react";

// ─────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────
const SERVICES = [
  {
    id: "ai",
    num: "01",
    label: "AI Systems",
    headline: "Intelligent by Design",
    icon: "◉",
    desc: "Custom models, LLM integrations, and AI pipelines tuned to your data — not generic wrappers built in an afternoon. We design every pipeline around how your business actually works, from data ingestion to inference. The result is a system that gets smarter as you grow, instead of one you outgrow in six months.",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.20)",
    gradient: "radial-gradient(ellipse 130% 90% at 95% -5%, rgba(0,212,255,0.11) 0%, transparent 60%)",
  },
  {
    id: "software",
    num: "02",
    label: "Software Dev",
    headline: "Systems That Scale",
    icon: "⊞",
    desc: "APIs, backend architecture, and platforms engineered to handle real pressure — built to grow, not to be replaced. We architect for the load you'll have next year, not just the demo you need tomorrow. Clean code, sane infrastructure, and systems your team can actually maintain after we hand it off.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.20)",
    gradient: "radial-gradient(ellipse 130% 90% at 95% -5%, rgba(167,139,250,0.11) 0%, transparent 60%)",
  },
  {
    id: "web",
    num: "03",
    label: "Web Development",
    headline: "Built to Convert",
    icon: "⬡",
    desc: "Fast, precise, and purposeful websites. Crafted to work hard for your business — not just look good in Figma. Every page is built around a goal, whether that's leads, sign-ups, or sales, and tuned for speed on every device. Design and performance work together here, not against each other.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.20)",
    gradient: "radial-gradient(ellipse 130% 90% at 95% -5%, rgba(52,211,153,0.11) 0%, transparent 60%)",
  },
  {
    id: "marketing",
    num: "04",
    label: "Digital Marketing",
    headline: "Growth That Compounds",
    icon: "⬈",
    desc: "Strategy, content, and campaigns built around your numbers — not vanity metrics that don't pay the bills. We track what actually moves revenue and cut what doesn't, channel by channel. Every campaign feeds the next one, so your growth compounds instead of resetting each quarter.",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.20)",
    gradient: "radial-gradient(ellipse 130% 90% at 95% -5%, rgba(251,146,60,0.11) 0%, transparent 60%)",
  },
  {
    id: "design",
    num: "05",
    label: "Graphic Design",
    headline: "Identity That Lasts",
    icon: "◈",
    desc: "Brand identity built to own its space. From mark to motion — visual language that works without explanation. We define the system once — color, type, motion, voice — so every touchpoint feels unmistakably yours. A brand people remember after they've forgotten the ad.",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.20)",
    gradient: "radial-gradient(ellipse 130% 90% at 95% -5%, rgba(244,114,182,0.11) 0%, transparent 60%)",
  },
];

// ─────────────────────────────────────────────────
// MATH HELPERS
// ─────────────────────────────────────────────────
const clamp       = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const invLerp     = (a, b, v)   => clamp((v - a) / (b - a), 0, 1);
const lerp        = (a, b, t)   => a + (b - a) * t;
const easeOutCubic    = (t) => 1 - Math.pow(1 - t, 3);


// ─────────────────────────────────────────────────
// SERVICE CARD — 3D carousel item
// ─────────────────────────────────────────────────
const ServiceCard = memo(function ServiceCard({ service, isActive, offset, onClick }) {
  const cardRef = useRef(null);
  const [tilt, setTilt]   = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const abs = Math.abs(offset);
  if (abs > 2) return null;

  const SPREAD  = 310;
  const tx      = offset * SPREAD;
  const ry      = offset * -42;
  const scale   = abs === 0 ? 1.0 : abs === 1 ? 0.80 : 0.60;
  const opacity = abs === 0 ? 1   : abs === 1 ? 0.55  : 0.22;
  const zIdx    = abs === 0 ? 10  : abs === 1 ? 6     : 2;

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isActive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width  - 0.5;
    const ny = (e.clientY - rect.top)  / rect.height - 0.5;
    setTilt({ x: ny * -10, y: nx * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  const innerTransform = isActive && hovered
    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : undefined;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) translateX(${tx}px) perspective(1200px) rotateY(${ry}deg) scale(${scale})`,
        opacity,
        zIndex: zIdx,
        transition: "transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease",
        cursor: abs > 0 ? "pointer" : "default",
        pointerEvents: "auto",
      }}
      onClick={abs > 0 ? onClick : undefined}
    >
      <div
        ref={cardRef}
        style={{
          width: "272px",
          minHeight: "410px",
          background: "linear-gradient(155deg, #0d0e1f 0%, #080911 100%)",
          borderRadius: "20px",
          border: isActive
            ? `1px solid ${service.color}38`
            : "1px solid rgba(255,255,255,0.07)",
          padding: "32px 28px 30px",
          position: "relative",
          overflow: "hidden",
          boxShadow: isActive
            ? `0 0 0 1px ${service.color}12, 0 28px 80px rgba(0,0,0,0.70), 0 0 55px ${service.glow}`
            : "0 14px 44px rgba(0,0,0,0.55)",
          transform: innerTransform,
          animation: isActive && !hovered ? "cardIdleRock 9s ease-in-out infinite" : "none",
          transition: innerTransform
            ? "box-shadow 0.4s ease, border-color 0.4s ease"
            : "box-shadow 0.4s ease, border-color 0.4s ease, transform 0.55s ease",
          willChange: "transform",
        }}
        onMouseEnter={() => isActive && setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Corner gradient wash */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: service.gradient,
          pointerEvents: "none",
          borderRadius: "20px",
        }} />

        {/* Top accent stripe */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "12%",
          right: "12%",
          height: "1.5px",
          background: `linear-gradient(90deg, transparent, ${service.color}${isActive ? "99" : "33"}, transparent)`,
          transition: "opacity 0.5s ease",
        }} />

        {/* Faint number watermark */}
        <div style={{
          position: "absolute",
          top: "-10px",
          right: "14px",
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "90px",
          fontWeight: 900,
          color: service.color,
          opacity: 0.042,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "-4px",
        }}>
          {service.num}
        </div>

        {/* Icon badge */}
        <div style={{
          position: "relative",
          zIndex: 2,
          width: "46px",
          height: "46px",
          borderRadius: "12px",
          background: `linear-gradient(135deg, ${service.color}1e, ${service.color}08)`,
          border: `1px solid ${service.color}28`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "22px",
        }}>
          <span style={{
            fontSize: "19px",
            color: service.color,
            lineHeight: 1,
            filter: isActive ? `drop-shadow(0 0 5px ${service.color}99)` : "none",
            transition: "filter 0.4s ease",
          }}>
            {service.icon}
          </span>
        </div>

        {/* Category label */}
        <div style={{
          position: "relative",
          zIndex: 2,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.32em",
          color: service.color,
          textTransform: "uppercase",
          opacity: 0.72,
          marginBottom: "9px",
        }}>
          {service.label}
        </div>

        {/* Headline */}
        <h3 style={{
          position: "relative",
          zIndex: 2,
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "17px",
          fontWeight: 700,
          color: "#ffffff",
          margin: "0 0 14px",
          letterSpacing: "0.01em",
          lineHeight: 1.3,
        }}>
          {service.headline}
        </h3>

        {/* Accent divider */}
        <div style={{
          position: "relative",
          zIndex: 2,
          width: "22px",
          height: "1.5px",
          background: service.color,
          opacity: isActive ? 0.55 : 0.25,
          marginBottom: "14px",
          borderRadius: "2px",
          transition: "opacity 0.4s ease",
        }} />

        {/* Description */}
        <p style={{
          position: "relative",
          zIndex: 2,
          fontFamily: "'Raleway', sans-serif",
          fontSize: "13.5px",
          fontWeight: 300,
          color: "rgba(255,255,255,0.42)",
          margin: 0,
          lineHeight: 1.78,
        }}>
          {service.desc}
        </p>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────
// SERVICES SECTION — 3D Carousel
// SCROLL PHASE 4 (0.65-0.82): carousel materialises, then holds
// ─────────────────────────────────────────────────
function ServicesSection({ scrollProgress }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);
  const sp = scrollProgress;

  const revealP  = easeOutCubic(invLerp(0.40, 0.65, sp));
  const sectionOpacity = sp < 0.40 ? 0 : sp < 0.65 ? revealP : 1;
  const isVisible = sp > 0.40;

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex(i => (i + 1) % SERVICES.length);
    }, 4200);
  };

  const goTo = (i) => {
    setActiveIndex(i);
    startTimer();
  };

  useEffect(() => {
    if (!isVisible) { clearInterval(timerRef.current); return; }
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [isVisible]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: sectionOpacity,
        pointerEvents: "none",
      }}
    >
      {/* Section header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "44px",
          opacity: easeOutCubic(invLerp(0.45, 0.60, sp)),
          transform: `translateY(${lerp(18, 0, easeOutCubic(invLerp(0.45, 0.60, sp)))}px)`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.35em",
            color: "#00d4ff",
            textTransform: "uppercase",
            marginBottom: "12px",
            opacity: 0.55,
          }}
        >
          Intelligence Stack
        </div>
        <h2
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)",
            fontWeight: 300,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          Our{" "}
          <span
            style={{
              fontWeight: 800,
              color: "#00d4ff",
              textShadow: "0 0 18px rgba(0,212,255,0.55)",
            }}
          >
            Capabilities
          </span>
        </h2>
      </div>

      {/* Carousel track */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "450px",
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        {SERVICES.map((service, i) => {
          let offset = i - activeIndex;
          if (offset > 2)  offset -= SERVICES.length;
          if (offset < -2) offset += SERVICES.length;
          return (
            <ServiceCard
              key={service.id}
              service={service}
              isActive={i === activeIndex}
              offset={offset}
              onClick={() => goTo(i)}
            />
          );
        })}
      </div>

      {/* Navigation dots */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "28px",
          pointerEvents: isVisible ? "auto" : "none",
          opacity: easeOutCubic(invLerp(0.48, 0.62, sp)),
        }}
      >
        {SERVICES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === activeIndex ? "22px" : "7px",
              height: "7px",
              borderRadius: "100px",
              background: i === activeIndex
                ? SERVICES[activeIndex].color
                : "rgba(255,255,255,0.20)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.35s ease",
              boxShadow: i === activeIndex
                ? `0 0 10px ${SERVICES[activeIndex].color}`
                : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// SCROLL INDICATOR
// ─────────────────────────────────────────────────
function ScrollIndicator({ visible }) {
  return (
    <div
      className="aura-scroll-indicator"
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: "11px",
          letterSpacing: "0.25em",
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
        }}
      >
        Scroll
      </div>
      <div
        style={{
          width: "1px",
          height: "40px",
          background: "linear-gradient(180deg, rgba(0,212,255,0.6), transparent)",
          animation: "scrollPulse 2s ease-in-out infinite",
        }}
      />
      <style>{`
        @media (max-width: 768px) {
          .aura-scroll-indicator { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────
// AURORA OVERLAY — CSS atmospheric color layer
// ─────────────────────────────────────────────────
function AuroraOverlay({ scrollProgress }) {
  const intensity =
    scrollProgress < 0.10 ? 0
    : scrollProgress < 0.35
      ? easeOutCubic(invLerp(0.10, 0.35, scrollProgress)) * 0.35
    : scrollProgress < 0.50
      ? lerp(0.35, 0.1, invLerp(0.35, 0.50, scrollProgress))
    : 0.1;

  if (intensity < 0.005) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        opacity: intensity,
        background: `
          radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0,212,255,0.15), transparent),
          radial-gradient(ellipse 60% 40% at 80% 20%, rgba(124,58,237,0.12), transparent),
          radial-gradient(ellipse 70% 60% at 50% 80%, rgba(0,212,255,0.08), transparent)
        `,
        mixBlendMode: "screen",
      }}
    />
  );
}

// ─────────────────────────────────────────────────
// PROGRESS DOTS — phase indicator on right edge
// ─────────────────────────────────────────────────
function ProgressDots({ scrollProgress }) {
  // One dot per phase boundary
  const phases = [0.00, 0.10, 0.25, 0.45, 0.65, 0.82];
  const currentPhase = phases.findIndex((p, i) => {
    const next = phases[i + 1] ?? 1.1;
    return scrollProgress >= p && scrollProgress < next;
  });

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 100,
        pointerEvents: "none",
        opacity: scrollProgress > 0.05 ? 0.6 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {phases.map((p, i) => (
        <div
          key={i}
          style={{
            width:  i === currentPhase ? "8px" : "4px",
            height: i === currentPhase ? "8px" : "4px",
            borderRadius: "50%",
            background: i === currentPhase ? "#00d4ff" : "rgba(255,255,255,0.25)",
            boxShadow: i === currentPhase ? "0 0 8px #00d4ff" : "none",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
// SECTION LABEL — phase name at top center
// ─────────────────────────────────────────────────
function SectionLabel({ scrollProgress }) {
  const label =
    scrollProgress < 0.10 ? ""
    : scrollProgress < 0.25 ? "AWAKENING"
    : scrollProgress < 0.40 ? "DECONSTRUCTING"
    : "";

  return (
    <div
      style={{
        position: "fixed",
        top: "28px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        pointerEvents: "none",
        opacity: scrollProgress > 0.12 ? 0.45 : 0,
        transition: "opacity 0.5s ease",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.35em",
        color: "#00d4ff",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────
function GlobalStyles() {
  useEffect(() => {
    const id = "aura-scroll-styles";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@300;400;600;800;900&family=Raleway:wght@100;200;300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

      @keyframes scrollPulse {
        0%, 100% { opacity: 0.6; transform: scaleY(1); }
        50%       { opacity: 1;   transform: scaleY(1.1); }
      }

      /* Subtle idle rock on the active carousel card */
      @keyframes cardIdleRock {
        0%   { transform: perspective(900px) rotateY(-1.2deg) rotateX(0.7deg); }
        35%  { transform: perspective(900px) rotateY(1.0deg)  rotateX(-0.5deg); }
        68%  { transform: perspective(900px) rotateY(-0.6deg) rotateX(0.3deg); }
        100% { transform: perspective(900px) rotateY(-1.2deg) rotateX(0.7deg); }
      }

      html { scroll-behavior: smooth; }
      body { overflow-x: hidden; }
    `;
    document.head.appendChild(style);
    return () => document.getElementById(id)?.remove();
  }, []);

  return null;
}

// ─────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────
export default function AuraScrollPage({
  SceneComponent,
  scrollProgress = 0,
  freeze         = false,
  showOfferings  = false,
  totalHeight    = 450,
}) {
  const sp = scrollProgress;

  return (
    <>
      <GlobalStyles />

      {/* Scroll spacer — sets total page height */}
      <div style={{ height: `${totalHeight}vh`, position: "relative" }} />

      {/* Fixed viewport — all layers stack here */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* 3D hero scene (Scene.jsx owns all 3D animation) */}
        {SceneComponent && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <SceneComponent
              scrollProgress={sp}
              freeze={freeze}
              showOfferings={showOfferings}
            />
          </div>
        )}

        {/* Fallback background when no SceneComponent */}
        {!SceneComponent && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background: "radial-gradient(ellipse at 50% 50%, #0a1628 0%, #020408 100%)",
            }}
          />
        )}

        {/* CSS aurora colour overlay */}
        <AuroraOverlay scrollProgress={sp} />

        {/* SCROLL PHASE 4: services HTML overlay, holds once revealed */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            pointerEvents: sp > 0.40 ? "auto" : "none",
          }}
        >
          <ServicesSection scrollProgress={sp} />
        </div>

        {/* UI chrome */}
        <SectionLabel  scrollProgress={sp} />
        <ProgressDots  scrollProgress={sp} />
        <ScrollIndicator visible={sp < 0.08} />
      </div>
    </>
  );
}
