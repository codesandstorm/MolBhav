/**
 * The live hero: a ladder of stone, glass and light whose rungs sit at the engine's heights.
 * Loaded only after the visitor's first interaction, and only when the gate (HeroScene) has
 * checked reduced motion, WebGL and Save-Data. Procedural geometry, no textures, no models,
 * no environment maps: the glass is a fresnel shader with a fake transmission gradient
 * (docs/product/15_design_language.md §7).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  BackSide,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  ShaderMaterial,
  type Group,
  type Mesh,
  type PointLight,
} from 'three';
import { color } from '@molbhav/tokens';
import { anchorsFor, pose, type Box } from '../lib/choreography.ts';
import { follow, piecewise, watchProgress } from '../lib/scroll-progress.ts';
import { createFpsGuard } from '../lib/fps-guard.ts';
import type { RungId } from '../lib/example.ts';

export interface LiveProps {
  permille: Record<RungId, number>;
  onReady: () => void;
  onFail: () => void;
}

/** Scroll target (written by the scroll watcher) and the eased value the frame loop reads. */
class Progress {
  target = 0;
  value = 0;
  started = false;
  set(p: number) {
    this.target = p;
    if (!this.started) {
      this.value = p; // take over at the current scroll position: no jump from the poster
      this.started = true;
    }
  }
  get moving() {
    return this.value !== this.target;
  }
  /** Eases toward the scroll target; called once per rendered frame. */
  step(dtMs: number) {
    this.value = follow(this.value, this.target, dtMs);
    return this.value;
  }
}

const VERTEX = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vUp;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vUp = normal.y;
    gl_Position = projectionMatrix * mv;
  }
`;

/** Cheap glass: tint in the middle, rim light at grazing angles, a lighter top face. */
const glass = (tint: string, rim: string, opacity: number, power: number) =>
  new ShaderMaterial({
    uniforms: {
      uTint: { value: new Color(tint) },
      uRim: { value: new Color(rim) },
      uOpacity: { value: opacity },
      uPower: { value: power },
    },
    vertexShader: VERTEX,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint;
      uniform vec3 uRim;
      uniform float uOpacity;
      uniform float uPower;
      varying vec3 vN;
      varying vec3 vV;
      varying float vUp;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        vec3 c = mix(uTint, uRim, f) + uRim * 0.14 * max(vUp, 0.0);
        gl_FragColor = vec4(c, uOpacity + f * (1.0 - uOpacity));
      }
    `,
    transparent: true,
    depthWrite: false,
  });

/** Additive halo for the opening rung; strength follows how lit the rung is. */
const halo = (tone: string) =>
  new ShaderMaterial({
    uniforms: { uColor: { value: new Color(tone) }, uStrength: { value: 1 } },
    vertexShader: VERTEX,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vN;
      varying vec3 vV;
      varying float vUp;
      void main() {
        // back faces of a larger capsule: bright behind the rung, fading to nothing at its edge
        float a = pow(abs(dot(normalize(vN), normalize(vV))), 2.4);
        gl_FragColor = vec4(uColor, a * 0.5 * uStrength);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: BackSide,
    blending: AdditiveBlending,
  });

const RUNG = 2.3;

function Ladder({
  permille,
  progress,
  onFail,
}: {
  permille: LiveProps['permille'];
  progress: Progress;
  onFail: () => void;
}) {
  const group = useRef<Group>(null);
  const floor = useRef<Mesh>(null);
  const target = useRef<Mesh>(null);
  const opening = useRef<Mesh>(null);
  const glowMesh = useRef<Mesh>(null);
  const lamp = useRef<PointLight>(null);
  const invalidate = useThree((s) => s.invalidate);
  const guard = useMemo(() => createFpsGuard(), []);
  const geo = useMemo(
    () => ({
      rung: new CapsuleGeometry(0.085, RUNG, 6, 20).rotateZ(Math.PI / 2),
      haloRung: new CapsuleGeometry(0.34, RUNG + 0.2, 8, 24).rotateZ(Math.PI / 2),
      rail: new CylinderGeometry(0.07, 0.08, 4.2, 16),
      slab: new DodecahedronGeometry(1, 0),
      rock: new DodecahedronGeometry(0.5, 0),
    }),
    [],
  );
  const mat = useMemo(
    () => ({
      rail: glass(color.scenePost, color.sceneGlow, 0.45, 1.8),
      target: glass(color.surfaceRaised, color.sceneCopper, 0.3, 1.15),
      halo: halo(color.sceneGlow),
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const s = pose(progress.step(delta * 1000), permille);
    if (group.current) group.current.rotation.y = s.yaw;
    floor.current?.position.setY(s.floorY);
    target.current?.position.setY(s.targetY);
    target.current?.scale.setX(s.targetWidth);
    if (target.current) target.current.visible = s.targetWidth > 0.08;
    opening.current?.position.setY(s.openingY);
    opening.current?.scale.setX(s.openingWidth);
    if (opening.current) opening.current.visible = s.openingWidth > 0.08;
    const glowMat = glowMesh.current?.material;
    if (glowMat instanceof ShaderMaterial) glowMat.uniforms.uStrength!.value = s.glow;
    if (lamp.current) {
      lamp.current.position.y = s.openingY + 0.4;
      lamp.current.intensity = 6 * s.glow;
    }
    if (progress.moving) {
      if (guard(clock.elapsedTime * 1000)) onFail();
      invalidate();
    }
  });

  return (
    <group ref={group} position={[0, -2.1, 0]}>
      {/* rails: thin glass */}
      <mesh geometry={geo.rail} material={mat.rail} position={[-1.3, 2.1, 0]} />
      <mesh geometry={geo.rail} material={mat.rail} position={[1.3, 2.1, 0]} />
      {/* stones at the foot */}
      <mesh geometry={geo.rock} position={[-0.9, 0.05, 0.25]} scale={[1.1, 0.7, 0.9]}>
        <meshStandardMaterial color={color.sceneStone} roughness={0.92} flatShading />
      </mesh>
      <mesh
        geometry={geo.rock}
        position={[0.55, 0, -0.2]}
        scale={[1.4, 0.8, 1]}
        rotation={[0, 0.8, 0]}
      >
        <meshStandardMaterial color={color.sceneStone} roughness={0.92} flatShading />
      </mesh>
      <mesh geometry={geo.rock} position={[1.25, -0.05, 0.35]} scale={[0.7, 0.5, 0.7]}>
        <meshStandardMaterial color={color.sceneStone} roughness={0.92} flatShading />
      </mesh>
      {/* floor: a dark stone slab */}
      <mesh ref={floor} geometry={geo.slab} scale={[1.28, 0.19, 0.42]} rotation={[0, 0.06, 0]}>
        <meshStandardMaterial color={color.sceneStone} roughness={0.88} flatShading />
      </mesh>
      {/* target: a glass rung with a copper rim */}
      <mesh ref={target} geometry={geo.rung} material={mat.target} />
      {/* opening: a rung of light with its halo */}
      <mesh ref={opening} geometry={geo.rung}>
        <meshBasicMaterial color={color.sceneGlow} toneMapped={false} />
        <mesh ref={glowMesh} geometry={geo.haloRung} material={mat.halo} />
      </mesh>
      <pointLight
        ref={lamp}
        color={color.sceneCopper}
        distance={4}
        decay={1.6}
        position={[0, 4, 0.6]}
      />
    </group>
  );
}

/** Frames the whole ladder (about 3.2 wide, 4.4 tall) at any stage aspect ratio. */
function CameraFit() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (!('fov' in camera)) return;
    const half = Math.tan(((camera.fov as number) * Math.PI) / 360);
    const aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(2.45 / half, 1.85 / (half * aspect));
    camera.position.set(0, 0.5, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}

const box = (el: Element | null): Box => {
  const r = el?.getBoundingClientRect();
  return { top: (r?.top ?? 0) + scrollY, height: r?.height ?? 0 };
};

/** Native scroll in, eased progress out; nothing is pinned or intercepted. Reads only. */
function ScrollLink({ progress }: { progress: Progress }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const q = (s: string) => document.querySelector(s);
    if (!q('[data-journey]')) return;
    const read = () => {
      const story = box(q('.story'));
      const layout = {
        storyTop: story.top,
        steps: [box(q('.step-floor')), box(q('.step-target')), box(q('.step-opening'))],
        end: story.top + story.height,
      } as const;
      return piecewise(scrollY, anchorsFor(layout, innerHeight));
    };
    return watchProgress(read, (p) => {
      progress.set(p);
      invalidate();
    });
  }, [invalidate, progress]);
  return null;
}

export default function LadderScene({ permille, onReady, onFail }: LiveProps) {
  const [progress] = useState(() => new Progress());
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const off = () => mq.matches && onFail();
    mq.addEventListener('change', off);
    return () => mq.removeEventListener('change', off);
  }, [onFail]);
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.5, 8], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', onFail);
        gl.domElement.setAttribute('aria-hidden', 'true');
        // two frames later the first picture is on screen: only then hide the poster
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      }}
    >
      <hemisphereLight args={[color.sceneGlow, color.surfaceRaised, 0.7]} />
      <directionalLight position={[4, 5, 3]} intensity={1.5} color={color.sceneGlow} />
      <directionalLight position={[-3, 2, -4]} intensity={1.1} color={color.sceneCopper} />
      <CameraFit />
      <Ladder permille={permille} progress={progress} onFail={onFail} />
      <ScrollLink progress={progress} />
    </Canvas>
  );
}
