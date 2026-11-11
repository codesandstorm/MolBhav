/**
 * The live hero: stone, glass and light, drawn from the scene model the poster is projected
 * from (src/lib/scene-model.ts), so its first frame is the poster. Loaded only after the
 * visitor's first interaction, and only when the gate (HeroScene) has checked reduced motion,
 * WebGL and Save-Data. Procedural geometry, no textures, no models, no post-processing; every
 * material is a small shader that runs the model's shading formulas on raw sRGB values
 * (docs/product/15_design_language.md §7).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Group,
  type Mesh,
  type PerspectiveCamera,
  type Points,
} from 'three';
import { anchorsFor, pose, type Box } from '../lib/choreography.ts';
import { follow, piecewise, watchProgress } from '../lib/scroll-progress.ts';
import { createFpsGuard } from '../lib/fps-guard.ts';
import type { RungId } from '../lib/example.ts';
import {
  CAMERA,
  GLASS,
  GROUP_Y,
  HALO,
  LIGHT,
  MOTES,
  PALETTE,
  RAIL,
  RIBBON,
  RUNG,
  STONES,
  add,
  cross,
  faceNormal,
  fitZoom,
  motes,
  norm,
  placeRock,
  ribbonPath,
  scale,
  slab,
  sub,
  type GlassLook,
  type Tri,
} from '../lib/scene-model.ts';

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
  step(dtMs: number) {
    this.value = follow(this.value, this.target, dtMs);
    return this.value;
  }
}

/** Pointer or device tilt, -1…1 on each axis, eased; small and never needed to use the page. */
class Parallax {
  tx = 0;
  ty = 0;
  x = 0;
  y = 0;
  get moving() {
    return this.x !== this.tx || this.y !== this.ty;
  }
  step(dtMs: number) {
    this.x = follow(this.x, this.tx, dtMs, 220);
    this.y = follow(this.y, this.ty, dtMs, 220);
  }
}

const v3 = (c: readonly number[]) => new Vector3(c[0], c[1], c[2]);

const WORLD_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vP;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vN = mat3(modelMatrix) * normal;
    vP = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

/** scene-model.ts shadeStone, per face (normal and centroid are face attributes). */
const stoneMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uStone: { value: v3(PALETTE.stone) },
      uCopper: { value: v3(PALETTE.copper) },
      uGlowC: { value: v3(PALETTE.glow) },
      uKey: { value: v3(LIGHT.key) },
      uRim: { value: v3(LIGHT.rim) },
      uGlow: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aCentroid;
      varying vec3 vN;
      varying vec3 vC;
      void main() {
        vN = mat3(modelMatrix) * normal;
        vC = (modelMatrix * vec4(aCentroid, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uStone, uCopper, uGlowC, uKey, uRim;
      uniform float uGlow;
      varying vec3 vN;
      varying vec3 vC;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vC);
        float diff = max(dot(n, uKey), 0.0);
        float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        float back = max(dot(n, uRim), 0.0);
        float up = max(n.y, 0.0);
        float k = 0.1 + 0.55 * diff * diff;
        float rim = 0.9 * fr + 0.7 * back * back * back;
        gl_FragColor = vec4(uStone * k + uCopper * rim + uGlowC * up * 0.1 * uGlow, 1.0);
      }
    `,
  });

/** scene-model.ts shadeGlass. */
const glassMaterial = (look: GlassLook, doubleSided = false) =>
  new ShaderMaterial({
    uniforms: {
      uTint: { value: v3(look.tint) },
      uRimC: { value: v3(look.rim) },
      uKey: { value: v3(LIGHT.key) },
      uBase: { value: look.base },
      uPower: { value: look.power },
      uSpec: { value: look.spec },
    },
    vertexShader: WORLD_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint, uRimC, uKey;
      uniform float uBase, uPower, uSpec;
      varying vec3 vN;
      varying vec3 vP;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vP);
        float d = dot(n, v);
        float f = pow(1.0 - abs(d), uPower);
        vec3 nn = d < 0.0 ? -n : n;
        float sp = pow(max(dot(nn, normalize(uKey + v)), 0.0), 40.0) * uSpec;
        vec3 c = mix(uTint, uRimC, f) + uRimC * max(nn.y, 0.0) * 0.12 + sp;
        gl_FragColor = vec4(c, clamp(uBase + f * (1.0 - uBase) + sp, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    ...(doubleSided ? { side: DoubleSide } : {}),
  });

/** scene-model.ts shadeLight. */
const lightMaterial = () =>
  new ShaderMaterial({
    uniforms: { uCopper: { value: v3(PALETTE.copper) }, uGlowC: { value: v3(PALETTE.glow) } },
    vertexShader: WORLD_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uCopper, uGlowC;
      varying vec3 vN;
      varying vec3 vP;
      void main() {
        float t = pow(abs(dot(normalize(vN), normalize(cameraPosition - vP))), 0.6);
        gl_FragColor = vec4(mix(uCopper, uGlowC, 0.35 + 0.65 * t), 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

/** scene-model.ts haloAlpha, added to what is behind it. */
const haloMaterial = () =>
  new ShaderMaterial({
    uniforms: { uGlowC: { value: v3(PALETTE.glow) }, uStrength: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vQ;
      void main() {
        vQ = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uGlowC;
      uniform float uStrength;
      varying vec2 vQ;
      void main() {
        float u = length(vQ);
        float a = u >= 1.0 ? 0.0 : 0.5 * uStrength * (1.0 - u) * (1.0 - u);
        gl_FragColor = vec4(uGlowC, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

/** Dust motes drifting up through the light; the same positions as the poster at time 0. */
const moteMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uGlowC: { value: v3(PALETTE.glow) },
      uTime: { value: 0 },
      uScale: { value: 1 },
      uRise: { value: MOTES.rise },
      uY0: { value: MOTES.box.y0 },
      uY1: { value: MOTES.box.y1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uScale, uRise, uY0, uY1;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aPhase;
      varying float vA;
      void main() {
        vec3 p = position;
        p.y = uY0 + mod(p.y - uY0 + uRise * uTime, uY1 - uY0);
        p.x += 0.05 * (sin(uTime * 0.4 + aPhase) - sin(aPhase));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 2.0 * aSize * uScale / -mv.z;
        vA = aAlpha;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uGlowC;
      varying float vA;
      void main() {
        float r = length(gl_PointCoord * 2.0 - 1.0);
        if (r > 1.0) discard;
        gl_FragColor = vec4(uGlowC, vA * (1.0 - r) * (1.0 - r));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

/** Flat-shaded solid: one normal and one centroid per face. */
const solidGeometry = (tris: Tri[]) => {
  const pos = new Float32Array(tris.length * 9);
  const nor = new Float32Array(tris.length * 9);
  const cen = new Float32Array(tris.length * 9);
  tris.forEach((t, i) => {
    const n = faceNormal(t);
    const c = scale(add(add(t[0], t[1]), t[2]), 1 / 3);
    for (let k = 0; k < 3; k++) {
      pos.set(t[k]!, i * 9 + k * 3);
      nor.set(n, i * 9 + k * 3);
      cen.set(c, i * 9 + k * 3);
    }
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nor, 3));
  g.setAttribute('aCentroid', new BufferAttribute(cen, 3));
  return g;
};

/** One half of the ribbon (the half nearer or farther than the ladder). */
const ribbonGeometry = (front: boolean) => {
  const path = ribbonPath();
  const pos: number[] = [];
  const nor: number[] = [];
  const hw = RIBBON.w / 2;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    if (a.p[2] + b.p[2] > 0 !== front) continue;
    const q = [
      add(a.p, scale(a.side, -hw)),
      add(b.p, scale(b.side, -hw)),
      add(b.p, scale(b.side, hw)),
      add(a.p, scale(a.side, hw)),
    ];
    const n = norm(cross(sub(q[1]!, q[0]!), sub(q[3]!, q[0]!)));
    for (const k of [0, 1, 2, 0, 2, 3]) {
      pos.push(...q[k]!);
      nor.push(...n);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  return g;
};

const moteGeometry = () => {
  const list = motes();
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(list.flatMap((m) => m.at)), 3));
  g.setAttribute('aSize', new BufferAttribute(new Float32Array(list.map((m) => m.size)), 1));
  g.setAttribute('aAlpha', new BufferAttribute(new Float32Array(list.map((m) => m.alpha)), 1));
  g.setAttribute('aPhase', new BufferAttribute(new Float32Array(list.map((m) => m.phase)), 1));
  return g;
};

/** Every material of the scene; per-frame values go in through `update`. */
class Materials {
  stone = stoneMaterial();
  rail = glassMaterial(GLASS.rail);
  target = glassMaterial(GLASS.target);
  ribbon = glassMaterial(GLASS.ribbon, true);
  light = lightMaterial();
  halo = haloMaterial();
  motes = moteMaterial();
  update(glow: number, time: number, pxPerUnit: number) {
    this.halo.uniforms.uStrength!.value = glow;
    this.stone.uniforms.uGlow!.value = glow;
    this.motes.uniforms.uTime!.value = time;
    this.motes.uniforms.uScale!.value = pxPerUnit;
  }
}

function Ladder({
  permille,
  progress,
  parallax,
  onFail,
}: {
  permille: LiveProps['permille'];
  progress: Progress;
  parallax: Parallax;
  onFail: () => void;
}) {
  const group = useRef<Group>(null);
  const floor = useRef<Mesh>(null);
  const target = useRef<Mesh>(null);
  const opening = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const dust = useRef<Points>(null);
  const invalidate = useThree((s) => s.invalidate);
  const guard = useMemo(() => createFpsGuard(), []);
  const geo = useMemo(
    () => ({
      rung: new CapsuleGeometry(RUNG.r, RUNG.half * 2, 8, 24).rotateZ(Math.PI / 2),
      rail: new CylinderGeometry(RAIL.r, RAIL.r, RAIL.h, 20).translate(0, RAIL.h / 2, 0),
      stones: solidGeometry(STONES.flatMap(placeRock)),
      slab: solidGeometry(slab()),
      halo: new PlaneGeometry(2, 2),
      ribbonBack: ribbonGeometry(false),
      ribbonFront: ribbonGeometry(true),
      motes: moteGeometry(),
    }),
    [],
  );
  const mat = useMemo(() => new Materials(), []);

  useFrame(({ clock, camera, size, viewport }, delta) => {
    const s = pose(progress.step(delta * 1000), permille);
    parallax.step(delta * 1000);
    if (group.current) group.current.rotation.y = s.yaw;
    floor.current?.position.setY(s.floorY);
    target.current?.position.setY(s.targetY);
    target.current?.scale.setX(s.targetWidth);
    if (target.current) target.current.visible = s.targetWidth > 0.08;
    opening.current?.position.setY(s.openingY);
    opening.current?.scale.setX(s.openingWidth);
    if (opening.current) opening.current.visible = s.openingWidth > 0.08;
    const cam = camera as PerspectiveCamera;
    mat.update(
      s.glow,
      clock.elapsedTime,
      (size.height * viewport.dpr) / 2 / (Math.tan((cam.fov * Math.PI) / 360) / cam.zoom),
    );
    cam.position.set(
      CAMERA.eye[0] + parallax.x * 0.45,
      CAMERA.eye[1] - parallax.y * 0.3,
      CAMERA.eye[2],
    );
    cam.lookAt(...CAMERA.target);
    if (progress.moving) {
      if (guard(clock.elapsedTime * 1000)) onFail();
      invalidate();
    } else if (parallax.moving) invalidate();
  });

  // render order matches the poster's painter's order
  return (
    <group ref={group} position={[0, GROUP_Y, 0]}>
      <mesh geometry={geo.ribbonBack} material={mat.ribbon} renderOrder={-10} />
      <mesh geometry={geo.rail} material={mat.rail} position={[-RAIL.x, 0, 0]} />
      <mesh geometry={geo.rail} material={mat.rail} position={[RAIL.x, 0, 0]} />
      <mesh geometry={geo.stones} material={mat.stone} />
      <mesh ref={floor} geometry={geo.slab} material={mat.stone} />
      <mesh ref={target} geometry={geo.rung} material={mat.target} renderOrder={1} />
      <mesh ref={opening} geometry={geo.rung} material={mat.light} renderOrder={2}>
        <mesh
          ref={halo}
          geometry={geo.halo}
          material={mat.halo}
          scale={[HALO.rx, HALO.ry, 1]}
          renderOrder={3}
        />
      </mesh>
      <mesh geometry={geo.ribbonFront} material={mat.ribbon} renderOrder={10} />
      <points ref={dust} geometry={geo.motes} material={mat.motes} renderOrder={20} />
    </group>
  );
}

const frameCamera = (cam: PerspectiveCamera, aspect: number) => {
  cam.fov = CAMERA.fov;
  cam.zoom = fitZoom(aspect);
  cam.position.set(...CAMERA.eye);
  cam.lookAt(...CAMERA.target);
  cam.updateProjectionMatrix();
};

/** Frames the scene by zoom only (the eye stays put), exactly as the poster's viewBox does. */
function CameraFit() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    frameCamera(camera as PerspectiveCamera, size.width / Math.max(size.height, 1));
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}

/**
 * Keeps the motes drifting at up to 30 frames a second while the stage is on screen and the
 * tab is visible. Stops for good if frames come too slowly (a busy or weak device): the
 * scene then only renders when scrolled, as before.
 */
function Ambient() {
  const { invalidate, gl } = useThree();
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let slow = 0;
    let visible = true;
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const gap = last ? now - last : 0;
      if (gap >= 33) {
        slow = gap > 90 ? slow + 1 : 0;
        if (slow > 20) return; // give up on ambient motion
        last = now;
        invalidate();
      } else if (!last) last = now;
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
      if (visible) start();
    });
    io.observe(gl.domElement);
    const onVis = () => !document.hidden && start();
    document.addEventListener('visibilitychange', onVis);
    start();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [invalidate, gl]);
  return null;
}

/** Pointer position and device tilt → parallax targets. Passive listeners; reads only. */
function ParallaxInput({ parallax }: { parallax: Parallax }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const clamp = (x: number) => (x < -1 ? -1 : x > 1 ? 1 : x);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      parallax.tx = clamp((e.clientX / innerWidth) * 2 - 1);
      parallax.ty = clamp((e.clientY / innerHeight) * 2 - 1);
      invalidate();
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      parallax.tx = clamp(e.gamma / 30);
      parallax.ty = clamp((e.beta - 45) / 30);
      invalidate();
    };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('deviceorientation', onTilt, { passive: true });
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('deviceorientation', onTilt);
    };
  }, [invalidate, parallax]);
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
  const [parallax] = useState(() => new Parallax());
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
      flat
      linear
      camera={{ position: CAMERA.eye, fov: CAMERA.fov }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', onFail);
        gl.domElement.setAttribute('aria-hidden', 'true');
        // two frames later the first picture is on screen: only then hide the poster
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      }}
    >
      <CameraFit />
      <Ladder permille={permille} progress={progress} parallax={parallax} onFail={onFail} />
      <ScrollLink progress={progress} />
      <ParallaxInput parallax={parallax} />
      <Ambient />
    </Canvas>
  );
}
