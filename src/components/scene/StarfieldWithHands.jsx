// scene/StarfieldWithHands.jsx
"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Pre-allocated objects to avoid GC pressure in hot path
const raycastPlane    = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const raycastIntersect = new THREE.Vector3();

export default function StarfieldWithHands({
    targetRef,
    count         = 4000,
    radius        = 80,
    handData      = null,
    useHandControl = false,
    freeze        = false,
}) {
    const pointsRef = useRef();
    const [mouseDown, setMouseDown] = useState(false);

    const { camera, pointer, raycaster } = useThree();

    const hold            = useRef(0);
    const sphereFormed    = useRef(false);
    const formationProgress = useRef(0);
    const interactionPoint  = useRef(new THREE.Vector3());
    const sphereCenter      = useRef(new THREE.Vector3());

    // ── Sphere surface target positions (offsets relative to artifact center) ──
    const targetPositions = useMemo(() => {
        const targets     = new Float32Array(count * 3);
        const sphereRadius = 2.2;

        for (let i = 0; i < count; i++) {
            const idx   = i * 3;
            const phi   = Math.acos(1 - 2 * (i + 0.5) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const x     = Math.cos(theta) * Math.sin(phi);
            const y     = Math.sin(theta) * Math.sin(phi);
            const z     = Math.cos(phi);
            const noise = 0.05;
            targets[idx]     = x * sphereRadius * (1 + (Math.random() - 0.5) * noise);
            targets[idx + 1] = y * sphereRadius * (1 + (Math.random() - 0.5) * noise);
            targets[idx + 2] = z * sphereRadius * (1 + (Math.random() - 0.5) * noise);
        }

        return targets;
    }, [count]);

    // ── Initial scattered positions + velocities ──────────────────────────
    const { positions, velocities } = useMemo(() => {
        const positions  = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const idx   = i * 3;
            const u     = Math.random();
            const v     = Math.random();
            const theta = 2 * Math.PI * u;
            const phi   = Math.acos(2 * v - 1);
            const r     = radius * Math.cbrt(Math.random());
            const sinPhi = Math.sin(phi);

            positions[idx]     = r * sinPhi * Math.cos(theta);
            positions[idx + 1] = r * sinPhi * Math.sin(theta);
            positions[idx + 2] = r * Math.cos(phi);

            velocities[idx]     = (Math.random() - 0.5) * 0.02;
            velocities[idx + 1] = (Math.random() - 0.5) * 0.02;
            velocities[idx + 2] = (Math.random() - 0.5) * 0.02;
        }

        return { positions, velocities };
    }, [count, radius]);

    // ── Event handlers ────────────────────────────────────────────────────
    const handlePointerDown = useCallback((e) => {
        if (e.button === 0 && !useHandControl) setMouseDown(true);
    }, [useHandControl]);

    const handlePointerUp = useCallback(() => setMouseDown(false), []);

    const handleDoubleClick = useCallback(() => {
        sphereFormed.current    = false;
        formationProgress.current = 0;
        hold.current            = 0;

        if (pointsRef.current) {
            const posAttr = pointsRef.current.geometry.getAttribute("position");
            const arr     = posAttr.array;

            for (let i = 0; i < count; i++) {
                const idx = i * 3;
                const dx  = arr[idx]     - sphereCenter.current.x;
                const dy  = arr[idx + 1] - sphereCenter.current.y;
                const dz  = arr[idx + 2] - sphereCenter.current.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
                const s   = 2.5;
                velocities[idx]     = (dx / dist) * s + (Math.random() - 0.5) * 0.5;
                velocities[idx + 1] = (dy / dist) * s + (Math.random() - 0.5) * 0.5;
                velocities[idx + 2] = (dz / dist) * s + (Math.random() - 0.5) * 0.5;
            }

            posAttr.needsUpdate = true;
        }
    }, [count, velocities]);

    useEffect(() => {
        if (!useHandControl) {
            window.addEventListener("pointerdown", handlePointerDown);
            window.addEventListener("pointerup", handlePointerUp);
            window.addEventListener("pointercancel", handlePointerUp);
        }
        window.addEventListener("dblclick", handleDoubleClick);

        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
            window.removeEventListener("dblclick", handleDoubleClick);
        };
    }, [useHandControl, handlePointerDown, handlePointerUp, handleDoubleClick]);

    // Temp vectors — allocated once, reused every frame
    const p           = useMemo(() => new THREE.Vector3(), []);
    const vel         = useMemo(() => new THREE.Vector3(), []);
    const dir         = useMemo(() => new THREE.Vector3(), []);
    const targetPos   = useMemo(() => new THREE.Vector3(), []);
    const centerTarget = useMemo(() => new THREE.Vector3(), []);

    const accelCurve = (x) => x * x * x;

    useFrame((_, delta) => {
        const geom = pointsRef.current?.geometry;
        if (!geom || freeze) return;

        // Sync artifact world position
        if (targetRef?.current) {
            targetRef.current.getWorldPosition(centerTarget);
            sphereCenter.current.copy(centerTarget);
        } else {
            centerTarget.set(0, 0, 0);
            sphereCenter.current.set(0, 0, 0);
        }

        // Mouse/hand interaction — always active regardless of scroll position
        if (useHandControl && handData) {
            const handX = (1 - handData.palmPos.x) * 2 - 1;
            const handY = -(handData.palmPos.y * 2 - 1);
            interactionPoint.current.set(
                handX * 5,
                handY * 5,
                sphereCenter.current.z + handData.palmPos.z * 3
            );

            if (handData.gestures.openHand && !sphereFormed.current) {
                hold.current = Math.min(1, hold.current + delta * 0.15);
                formationProgress.current = Math.min(1, formationProgress.current + delta * 0.15);
                if (formationProgress.current > 0.95) sphereFormed.current = true;
            } else if (handData.gestures.fist && sphereFormed.current) {
                sphereFormed.current = false;
                formationProgress.current = 0;
                hold.current = 0;
            } else if (!sphereFormed.current && handData.tension > 0.6) {
                hold.current = Math.min(1, hold.current + delta * 0.15);
                formationProgress.current = Math.min(1, formationProgress.current + delta * 0.15);
                if (formationProgress.current > 0.95) sphereFormed.current = true;
            } else if (!sphereFormed.current) {
                hold.current = Math.max(0, hold.current - delta * 0.3);
                formationProgress.current = Math.max(0, formationProgress.current - delta * 0.3);
            }
        } else {
            raycaster.setFromCamera(pointer, camera);
            raycastPlane.constant = -sphereCenter.current.z;
            raycaster.ray.intersectPlane(raycastPlane, raycastIntersect);
            if (raycastIntersect) interactionPoint.current.copy(raycastIntersect);

            if (mouseDown && !sphereFormed.current) {
                hold.current = Math.min(1, hold.current + delta * 0.15);
                formationProgress.current = Math.min(1, formationProgress.current + delta * 0.15);
                if (formationProgress.current > 0.95) sphereFormed.current = true;
            } else if (!mouseDown && !sphereFormed.current) {
                hold.current = Math.max(0, hold.current - delta * 0.3);
                formationProgress.current = Math.max(0, formationProgress.current - delta * 0.3);
            }
        }

        const a = accelCurve(hold.current);

        const posAttr = geom.getAttribute("position");
        const arr     = posAttr.array;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            p.set(arr[idx], arr[idx + 1], arr[idx + 2]);
            vel.set(velocities[idx], velocities[idx + 1], velocities[idx + 2]);

            if (sphereFormed.current || a > 0.01) {
                // ── NORMAL SPHERE FORMATION / INTERACTION ─────────────────

                targetPos.set(
                    centerTarget.x + targetPositions[idx],
                    centerTarget.y + targetPositions[idx + 1],
                    centerTarget.z + targetPositions[idx + 2]
                );

                if (sphereFormed.current) {
                    const distToInteraction = p.distanceTo(interactionPoint.current);
                    const attractRadius = 1.5;

                    if (distToInteraction < attractRadius) {
                        dir.copy(interactionPoint.current).sub(p);
                        if (dir.lengthSq() > 0.001) {
                            dir.normalize();
                            const falloff = 1 - distToInteraction / attractRadius;
                            const smoothFalloff = falloff * falloff * falloff;
                            const baseStrength  = useHandControl ? 10.0 : 8.0;
                            vel.addScaledVector(dir, smoothFalloff * baseStrength * delta);
                        }
                    }
                }

                dir.copy(targetPos).sub(p);
                const dist = dir.length();

                if (dist > 0.01) {
                    dir.normalize();
                    const attractionStrength = sphereFormed.current
                        ? THREE.MathUtils.lerp(12.0, 18.0, 1 - dist / 2.0)
                        : THREE.MathUtils.lerp(5.0, 20.0, a);

                    vel.addScaledVector(dir, attractionStrength * delta);
                    vel.multiplyScalar(sphereFormed.current ? 0.94 : 0.92);
                } else {
                    vel.multiplyScalar(0.88);
                }

                if (sphereFormed.current && dist < 0.15) {
                    const jitter = 0.0005;
                    vel.x += (Math.random() - 0.5) * jitter;
                    vel.y += (Math.random() - 0.5) * jitter;
                    vel.z += (Math.random() - 0.5) * jitter;
                }

            } else {
                // ── IDLE DRIFT ────────────────────────────────────────────
                vel.multiplyScalar(0.997);
            }

            // Integrate
            p.addScaledVector(vel, delta * 50);

            arr[idx]     = p.x;
            arr[idx + 1] = p.y;
            arr[idx + 2] = p.z;

            velocities[idx]     = vel.x;
            velocities[idx + 1] = vel.y;
            velocities[idx + 2] = vel.z;
        }

        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={positions}
                    itemSize={3}
                    count={count}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.025}
                color="#ffffff"
                transparent
                opacity={0.9}
                depthWrite={false}
                sizeAttenuation={true}
            />
        </points>
    );
}
