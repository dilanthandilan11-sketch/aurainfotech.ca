// scene/Artifact.jsx
"use client"

import React, { forwardRef, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, useGLTF, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

const Artifact = forwardRef(function Artifact(
    { mood = null, freeze = false, scrollProgress = 0 },
    externalRef
) {
    const internalRef = useRef();
    const group = externalRef ?? internalRef;

    // One ref slot per mesh — used to mutate chromaticAberration in useFrame
    const materialRefs = useRef([]);

    const { viewport } = useThree();
    const responsiveScale = Math.min(1.5, Math.max(0.65, viewport.width * 0.22));

    const { scene } = useGLTF("/models/aura-logo.glb");

    const glass = useMemo(
        () => ({
            backside: true,
            samples: 16,
            resolution: 1024,
            thickness: 0.5,
            chromaticAberration: 0.05,
            anisotropy: 0.1,
            distortion: 0.2,
            ior: 1.5,
            reflectivity: 0.2,
            distortionScale: 0.5,
            temporalDistortion: 0.1,
            color: "#1a4e4d",
            transparent: true,
            transmission: 0.8,
        }),
        []
    );

    const meshes = useMemo(() => {
        const arr = [];
        scene.updateMatrixWorld(true);
        scene.traverse((obj) => {
            if (!obj.isMesh) return;
            arr.push({ geometry: obj.geometry, matrix: obj.matrixWorld.clone() });
        });
        return arr;
    }, [scene]);

    useFrame((state) => {
        if (!group.current) return;

        const sp = scrollProgress;

        // SCROLL PHASE 1 (0.10-0.25): pointer sensitivity ramps up 0.5 → 0.8
        // SCROLL PHASE 2 (0.25-0.45): sensitivity returns 0.8 → 0.5
        const sensitivity =
            sp < 0.10 ? 0.5
            : sp < 0.25 ? THREE.MathUtils.lerp(0.5, 0.8, (sp - 0.10) / 0.15)
            : sp < 0.45 ? THREE.MathUtils.lerp(0.8, 0.5, (sp - 0.25) / 0.20)
            : 0.5;

        // Pointer-reactive rotation
        if (state.pointer && !freeze) {
            const { x, y } = state.pointer;
            group.current.rotation.y = THREE.MathUtils.lerp(
                group.current.rotation.y,
                x * sensitivity,
                0.05
            );
            group.current.rotation.x = THREE.MathUtils.lerp(
                group.current.rotation.x,
                -y * sensitivity,
                0.05
            );
        }

        // Gentle floating animation
        if (!freeze) {
            const targetY = Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
            group.current.position.y = THREE.MathUtils.lerp(
                group.current.position.y,
                targetY,
                0.02
            );
        }

        // SCROLL PHASE 1 (0.10-0.25): chromaticAberration pulses 0.05 → 0.12
        // SCROLL PHASE 2 (0.25-0.45): fades back 0.12 → 0.05 as artifact collapses
        const ca =
            sp < 0.10 ? 0.05
            : sp < 0.25 ? THREE.MathUtils.lerp(0.05, 0.12, (sp - 0.10) / 0.15)
            : sp < 0.45 ? THREE.MathUtils.lerp(0.12, 0.05, (sp - 0.25) / 0.20)
            : 0.05;

        materialRefs.current.forEach((mat) => {
            if (mat) mat.chromaticAberration = ca;
        });

        // SCROLL PHASE 2 (0.25-0.45): scale collapses 1.0 → 0.0
        // SCROLL PHASE 3-4 (0.45-0.82): scale held at 0.0
        // SCROLL PHASE 5 (0.82-1.00): scale reforms 0.0 → 1.0
        const targetScale =
            sp < 0.25 ? 1.0
            : sp < 0.45 ? THREE.MathUtils.lerp(1.0, 0.0, (sp - 0.25) / 0.20)
            : sp < 0.82 ? 0.0
            : THREE.MathUtils.lerp(0.0, 1.0, (sp - 0.82) / 0.18);

        group.current.scale.setScalar(
            THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.08)
        );
    });

    return (
        <group ref={group} position={[0, 0, 0]}>
            <Environment
                preset="night"
                background={false}
                rotation={[Math.PI / 2, 0, 0]}
                environmentIntensity={0.01}
                resolution={256}
            />

            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />

            <Center scale={responsiveScale}>
                {meshes.map((m, i) => (
                    <mesh
                        key={`glass-${i}`}
                        geometry={m.geometry}
                        matrix={m.matrix}
                        matrixAutoUpdate={false}
                        frustumCulled={false}
                    >
                        <MeshTransmissionMaterial
                            ref={(r) => (materialRefs.current[i] = r)}
                            {...glass}
                        />
                    </mesh>
                ))}
            </Center>
        </group>
    );
});

export default Artifact;

useGLTF.preload("/models/aura-logo.glb");
