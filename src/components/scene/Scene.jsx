// src/components/scene/Scene.jsx
"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import Artifact from "@/components/scene/Artifact";
import StarfieldWithHands from "@/components/scene/StarfieldWithHands";
import AuroraStreaksFlowing from "@/components/scene/AuroraStreaksFlowing";
import HandTracking from "@/components/scene/HandTracking";
import SceneText from "@/components/scene/SceneText";
import { Fluid } from "@/lib/Fluid";
import { DEFAULT_CONFIG } from "@/lib/constant";

// ── Nebula Background ──────────────────────────────────────────────────────
function NebulaBackground() {
    const texture = useLoader(RGBELoader, "/hdri/Nebula_N0.hdr");
    texture.mapping = THREE.EquirectangularReflectionMapping;

    return (
        <mesh>
            <sphereGeometry args={[500, 32, 32]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
        </mesh>
    );
}

// ── Dynamic Post-Processing ────────────────────────────────────────────────
function DynamicEffects({ scrollProgress }) {
    const sp = scrollProgress;

    // SCROLL PHASE 0 (0.00-0.10): bloom 0.15 — dormant
    // SCROLL PHASE 1 (0.10-0.25): bloom 0.15→0.35 — activating
    // SCROLL PHASE 2 (0.25-0.45): bloom 0.35→0.50 — deconstruction flash
    // SCROLL PHASE 3 (0.45-0.65): bloom 0.15      — clean stream lines
    // SCROLL PHASE 4 (0.65-0.82): bloom 0.20      — card glow
    // SCROLL PHASE 5 (0.82-1.00): bloom 0.20→0.15 — return to idle
    let bloomIntensity;
    if (sp < 0.10) {
        bloomIntensity = 0.15;
    } else if (sp < 0.25) {
        bloomIntensity = THREE.MathUtils.lerp(0.15, 0.35, (sp - 0.10) / 0.15);
    } else if (sp < 0.45) {
        bloomIntensity = THREE.MathUtils.lerp(0.35, 0.50, (sp - 0.25) / 0.20);
    } else if (sp < 0.65) {
        bloomIntensity = 0.15;
    } else if (sp < 0.82) {
        bloomIntensity = 0.20;
    } else {
        bloomIntensity = THREE.MathUtils.lerp(0.20, 0.15, (sp - 0.82) / 0.18);
    }

    const caBase = 0.0005;
    const caPeak = sp > 0.10 && sp < 0.55 ? 0.001 : caBase;

    return (
        <EffectComposer>
            <Fluid {...DEFAULT_CONFIG} showBackground={true} rainbow={true} />
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.85} />
            <ChromaticAberration offset={[caPeak, caPeak]} />
            <Noise opacity={0.025} />
        </EffectComposer>
    );
}

// ── Camera Rig ─────────────────────────────────────────────────────────────
// Camera stays fixed at Z=6 throughout — scroll narrative is told through
// artifact scale + aurora + service cards, not camera movement.
function CameraRig() {
    return null;
}

// ── Scene Content ──────────────────────────────────────────────────────────
function SceneContent({ handData, useHandControl, rotation, freeze, scrollProgress }) {
    const groupRef     = useRef();
    const logoCenterRef = useRef(null);

    useFrame(() => {
        if (!groupRef.current || freeze) return;
        groupRef.current.rotation.x = rotation.x;
        groupRef.current.rotation.y = rotation.y;
        groupRef.current.rotation.z = rotation.z;
    });

    // ── Aurora opacity/intensity per scroll phase ──────────────────────────
    // Passed as props — AuroraStreaksFlowing.jsx is not edited per constraints.
    // SCROLL PHASE 0 (0.00-0.10): defaults (0.30 / 0.80)
    // SCROLL PHASE 1 (0.10-0.25): opacity 0.30→0.60, intensity 0.80→1.00
    // SCROLL PHASE 2 (0.25-0.45): opacity 0.60→0.80, intensity 1.00→1.20
    // SCROLL PHASE 3 (0.45-0.65): peak held (0.80 / 1.20)
    // SCROLL PHASE 4 (0.65-0.82): reduce back to defaults
    // SCROLL PHASE 5 (0.82-1.00): hold at defaults
    const sp = scrollProgress;
    let a1o, a1i, a2o, a2i; // aurora1/2 opacity/intensity

    if (sp < 0.10) {
        a1o = 0.30; a1i = 0.80; a2o = 0.25; a2i = 0.70;
    } else if (sp < 0.25) {
        const t = (sp - 0.10) / 0.15;
        a1o = THREE.MathUtils.lerp(0.30, 0.60, t);
        a1i = THREE.MathUtils.lerp(0.80, 1.00, t);
        a2o = THREE.MathUtils.lerp(0.25, 0.50, t);
        a2i = THREE.MathUtils.lerp(0.70, 0.90, t);
    } else if (sp < 0.45) {
        const t = (sp - 0.25) / 0.20;
        a1o = THREE.MathUtils.lerp(0.60, 0.80, t);
        a1i = THREE.MathUtils.lerp(1.00, 1.20, t);
        a2o = THREE.MathUtils.lerp(0.50, 0.70, t);
        a2i = THREE.MathUtils.lerp(0.90, 1.10, t);
    } else if (sp < 0.65) {
        a1o = 0.80; a1i = 1.20; a2o = 0.70; a2i = 1.10;
    } else if (sp < 0.82) {
        const t = (sp - 0.65) / 0.17;
        a1o = THREE.MathUtils.lerp(0.80, 0.30, t);
        a1i = THREE.MathUtils.lerp(1.20, 0.80, t);
        a2o = THREE.MathUtils.lerp(0.70, 0.25, t);
        a2i = THREE.MathUtils.lerp(1.10, 0.70, t);
    } else {
        a1o = 0.30; a1i = 0.80; a2o = 0.25; a2i = 0.70;
    }

    return (
        <>
            <CameraRig scrollProgress={scrollProgress} />
            <group ref={groupRef}>
                <NebulaBackground />

                <group position={[0, 0, -20]}>
                    <AuroraStreaksFlowing
                        count={1}
                        opacity={a1o}
                        intensity={a1i}
                        speed={0.25}
                        colorScheme={0}
                        offset={0}
                    />
                    <AuroraStreaksFlowing
                        count={1}
                        opacity={a2o}
                        intensity={a2i}
                        speed={0.2}
                        colorScheme={1}
                        offset={1.5}
                    />
                </group>

                <StarfieldWithHands
                    targetRef={logoCenterRef}
                    handData={handData}
                    useHandControl={useHandControl}
                    count={4000}
                />

                <Artifact
                    ref={logoCenterRef}
                    mood={null}
                    freeze={freeze}
                    scrollProgress={scrollProgress}
                />

                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={1.0} color="#00cfff" />
                <pointLight position={[-10, -10, -5]} intensity={0.8} color="#4B0082" />
            </group>
        </>
    );
}

// ── Main Scene ─────────────────────────────────────────────────────────────
export default function Scene({ freeze = false, scrollProgress = 0 }) {
    const [useHandControl, setUseHandControl] = useState(false);
    const [handData, setHandData]             = useState(null);
    const [rotation, setRotation]             = useState({ x: 0, y: 0, z: 0 });
    const [unfreezeProgress, setUnfreezeProgress] = useState(freeze ? 0 : 1);

    useEffect(() => {
        if (freeze) { setUnfreezeProgress(0); return; }

        const startTime = performance.now();
        const duration  = 2000;

        const animate = () => {
            const elapsed  = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setUnfreezeProgress(1 - Math.pow(1 - progress, 3));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [freeze]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (useHandControl || freeze) return;

            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = (e.clientY / window.innerHeight) * 2 - 1;

            const lerpFactor = 0.05 * unfreezeProgress;
            const rotScale   = THREE.MathUtils.lerp(0.15, 0.05, scrollProgress);

            setRotation((prev) => ({
                x: THREE.MathUtils.lerp(prev.x, -mouseY * Math.PI * rotScale, lerpFactor),
                y: THREE.MathUtils.lerp(prev.y,  mouseX * Math.PI * (rotScale * 1.5), lerpFactor),
                z: prev.z,
            }));
        };

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === "h") setUseHandControl((prev) => !prev);
            if (key === "r") setRotation({ x: 0, y: 0, z: 0 });
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [useHandControl, freeze, unfreezeProgress, scrollProgress]);

    useEffect(() => {
        if (!useHandControl || !handData) return;

        const { palmPos } = handData;
        const handX = (1 - palmPos.x) * 2 - 1;
        const handY = palmPos.y * 2 - 1;

        setRotation((prev) => ({
            x: THREE.MathUtils.lerp(prev.x, -handY * Math.PI * 0.3, 0.08),
            y: THREE.MathUtils.lerp(prev.y,  handX * Math.PI * 0.4, 0.08),
            z: prev.z,
        }));
    }, [handData, useHandControl]);

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                backgroundColor: "#020204",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <HandTracking enabled={useHandControl} onHandData={setHandData} />

            <Canvas
                camera={{ position: [0, 0, 6], fov: 40, near: 0.1, far: 1000 }}
                gl={{ antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 2]}
                style={{ position: "absolute", inset: 0, zIndex: 1 }}
            >
                <Suspense fallback={null}>
                    <SceneContent
                        handData={handData}
                        useHandControl={useHandControl}
                        rotation={rotation}
                        freeze={freeze}
                        scrollProgress={scrollProgress}
                    />
                    <DynamicEffects scrollProgress={scrollProgress} />
                </Suspense>
            </Canvas>

            <SceneText scrollProgress={scrollProgress} />

            <div
                style={{
                    position: "fixed",
                    bottom: "30px",
                    right: "20px",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "11px",
                    fontFamily: "'Sora', monospace",
                    pointerEvents: "none",
                    zIndex: 200,
                    textAlign: "right",
                    lineHeight: 1.6,
                    opacity: Math.max(0, 1 - scrollProgress * 3),
                    transition: "opacity 0.3s ease",
                }}
            >
                <div>[H] Hand Control: {useHandControl ? "ON" : "OFF"}</div>
                <div>[R] Reset View</div>
                {useHandControl && handData && (
                    <div style={{ marginTop: "5px", color: "rgba(0,174,239,0.6)" }}>
                        Hand detected
                    </div>
                )}
            </div>
        </div>
    );
}
