"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scrollSignal } from "@/lib/scrollSignal";
import { streamVertex, streamFragment } from "./streamShader";

const COUNT = 6000;
const WIDTH = 16; // flow field width (overfills the viewport horizontally)
const HEIGHT = 9; // band height (overfills vertically; edges run off-screen)

function Stream() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Build the particle field once. position + two per-particle attributes.
  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const wobbles = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = Math.random() * WIDTH - WIDTH / 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
      seeds[i] = Math.random();
      wobbles[i] = Math.random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aLaneWobble", new THREE.BufferAttribute(wobbles, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZoom: { value: 0 },
      uVelocity: { value: 0 },
      uSize: { value: 22 },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1,
      },
      uWidth: { value: WIDTH },
      uAmber: { value: new THREE.Color("#F6A92B") },
      uCoral: { value: new THREE.Color("#FF6B57") },
      uPeri: { value: new THREE.Color("#8B8BFA") },
      uThrottle: { value: 0 },
      uAgent: { value: 0 },
      uPulse: { value: 0 },
      uFocus: { value: 0 },
      uRate: { value: 0.5 },
    }),
    []
  );

  // Smoothed targets so the stream eases rather than snaps.
  const zoom = useRef(0);
  const vel = useRef(0);
  const agent = useRef(0);
  const throttle = useRef(0);
  const focus = useRef(0);
  const rate = useRef(0.5);

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05); // clamp tab-switch spikes

    m.uniforms.uTime.value += dt;

    zoom.current += (scrollSignal.zoom - zoom.current) * Math.min(1, dt * 3);
    vel.current += (scrollSignal.velocity - vel.current) * Math.min(1, dt * 5);
    agent.current += (scrollSignal.agent - agent.current) * Math.min(1, dt * 3);
    // Throttle eases slowly — that lag IS the agent's visible deliberation.
    throttle.current +=
      (scrollSignal.throttle - throttle.current) * Math.min(1, dt * 2.2);
    focus.current += (scrollSignal.focus - focus.current) * Math.min(1, dt * 3);
    rate.current += (scrollSignal.rate - rate.current) * Math.min(1, dt * 4);

    // Decision pulse: an exponential flash from the last commit timestamp.
    const since = performance.now() - scrollSignal.pulseAt;
    const pulse = since < 1200 ? Math.exp(-since / 280) : 0;

    m.uniforms.uZoom.value = zoom.current;
    m.uniforms.uVelocity.value = vel.current;
    m.uniforms.uAgent.value = agent.current;
    m.uniforms.uThrottle.value = throttle.current;
    m.uniforms.uFocus.value = focus.current;
    m.uniforms.uRate.value = rate.current;
    m.uniforms.uPulse.value = pulse;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={streamVertex}
        fragmentShader={streamFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function StreamCanvas() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#16100C"]} />
        <Stream />
      </Canvas>
    </div>
  );
}
