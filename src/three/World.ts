import {
  NormalBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ColorManagement,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  HemisphereLight,
  DirectionalLight,
  Matrix4,
  WebGLRenderer,
  Group,
  MeshLambertMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  Box3,
} from 'three';
import type { Mood } from '../content/types';
import type { Lantern } from '../experience/beats';
import { PALETTES, type Palette, type WorldApi } from './moods';
import type { Quality } from '../utils/device';
import { buildRiders, type Riders } from './riders';
import type { Frame, Rider } from './moods';

/**
 * Camera framings relative to the riders, in the riders' own space:
 *   off  = where the camera sits   (x forward, y up, z to the side)
 *   look = where it looks
 */
const FRAMES: Record<Frame, { off: [number, number, number]; look: [number, number, number] }> = {
  // riding between stops: riders low-centre, the path opening ahead
  travel: { off: [-2.3, 0.75, 0.05], look: [1.6, 0.18, -0.05] },
  // a close, three-quarter view of the three of them (the opening)
  hero: { off: [0.45, 0.4, 1.6], look: [0.24, 0.13, 0] },
  // the bump: side on and a little wider, so the startle and the seat swap read clearly
  incident: { off: [0.8, 0.5, 2.9], look: [0.5, 0.1, -0.05] },
  // stopped at a memory: riders small, parked in the band below the memory
  stop: { off: [-6, 1, -0.6], look: [2.5, 4, 1.5] },
  // the end: small and centred at the foot of the bright, open landscape, below the final words
  settle: { off: [-6, 1, 0.3], look: [2.5, 4, -0.3] },
};

/** Wide screens see more sideways and less vertically, so a few framings differ there. */
const FRAMES_WIDE: Partial<typeof FRAMES> = {
  stop: { off: [-6, 0.6, 0.6], look: [2.5, 3.4, 3] },
  settle: { off: [-6, 1, 0], look: [2.5, 3, 0] },
};

/**
 * THE THREAD OF LIGHT
 * One luminous thread winds through darkness. The camera travels along it
 * from 19 to 20. Memories wait beside it as lanterns and small floating prints.
 */

// Palette hex values are used exactly as written (no linear conversion),
// so the mood colours in moods.ts are what you see on screen.
ColorManagement.enabled = false;

const SOFT_POINT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, clamp(a * vAlpha, 0.0, 1.0));
  }
`;

class LivePalette {
  top = new Color();
  bottom = new Color();
  horizon = new Color();
  thread = new Color();
  dust = new Color();
  horizonStrength = 0;
  threadIntensity = 0;
  dustAmount = 0;
  flow = 0.5;
  static from(p: Palette) {
    const l = new LivePalette();
    l.top.set(p.top);
    l.bottom.set(p.bottom);
    l.horizon.set(p.horizon);
    l.thread.set(p.thread);
    l.dust.set(p.dust);
    l.horizonStrength = p.horizonStrength;
    l.threadIntensity = p.threadIntensity;
    l.dustAmount = p.dustAmount;
    l.flow = p.flow;
    return l;
  }
  lerp(t: LivePalette, k: number) {
    this.top.lerp(t.top, k);
    this.bottom.lerp(t.bottom, k);
    this.horizon.lerp(t.horizon, k);
    this.thread.lerp(t.thread, k);
    this.dust.lerp(t.dust, k);
    this.horizonStrength += (t.horizonStrength - this.horizonStrength) * k;
    this.threadIntensity += (t.threadIntensity - this.threadIntensity) * k;
    this.dustAmount += (t.dustAmount - this.dustAmount) * k;
    this.flow += (t.flow - this.flow) * k;
  }
}

export class World implements WorldApi {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(55, 1, 0.05, 260);
  private curve: CatmullRomCurve3;
  private live = LivePalette.from(PALETTES.void);
  private target = LivePalette.from(PALETTES.void);
  private sky: Mesh;
  private thread: Points;
  private lanterns: Points;
  private dust: Points;
  private u = 0;
  private uTarget = 0;
  private reveal = 0;
  private revealTarget = 0;
  private focus = 0;
  private focusTarget = 0;
  private follow = 1.5;
  private cloud: Group;
  private cloudMat: MeshLambertMaterial;
  private cloudU: number | null = null;
  private cloudGone = 1; // 0 = present, 1 = drifted away
  private cloudSquash = 0;
  private onContact: (() => void) | null = null;
  private contactGap = 0;
  private markers: Sprite[] = [];
  private markerTex: CanvasTexture;
  private box = new Box3();
  private reduced = false;
  private idle = false;
  private raf = 0;
  private last = performance.now();
  private time = 0;
  private frame = 0;
  private dpr: number;
  private frameTimes: number[] = [];
  private degraded = 0;
  private threadCount: number;
  private dustCount: number;
  private tmpA = new Vector3();
  private tmpB = new Vector3();
  private riders: Riders;
  private frameName: Frame = 'travel';
  private wide = false;
  private camOff = new Vector3(...FRAMES.travel.off);
  private lookOff = new Vector3(...FRAMES.travel.look);
  private lastU = 0;
  private speed = 0;
  private waveUntil = 0;
  private basis = new Matrix4();
  private fwd = new Vector3();
  private up = new Vector3(0, 1, 0);
  private side = new Vector3();
  private anchor = new Vector3();
  private onResize = () => this.resize();
  private onVis = () => (document.hidden ? cancelAnimationFrame(this.raf) : this.start());

  constructor(canvas: HTMLCanvasElement, lanterns: Lantern[], quality: Quality) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.dpr = Math.min(window.devicePixelRatio || 1, quality.maxDpr);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = 'srgb-linear';

    // A long, gently winding path heading into -z.
    const pts: Vector3[] = [];
    for (let i = 0; i <= 44; i++) {
      const z = -i * 11;
      const x = Math.sin(i * 0.52) * 5 + Math.sin(i * 0.19 + 1) * 4;
      const y = Math.sin(i * 0.33) * 1.3 + Math.cos(i * 0.11) * 0.8;
      pts.push(new Vector3(x, y, z));
    }
    this.curve = new CatmullRomCurve3(pts, false, 'centripetal');

    this.threadCount = quality.threadParticles;
    this.dustCount = quality.dustParticles;
    this.sky = this.makeSky();
    this.thread = this.makeThread(this.threadCount);
    this.lanterns = this.makeLanterns(lanterns);
    this.dust = this.makeDust(this.dustCount);
    this.scene.add(this.sky, this.thread, this.lanterns, this.dust);

    // the riders: one persistent set for the whole journey
    this.riders = buildRiders(quality.tier === 'low' ? 70 : 140);
    this.riders.group.scale.setScalar(0.2);
    this.riders.group.visible = false;
    this.scene.add(this.riders.group);
    // the soft cloud for the bump on the first stretch
    this.cloudMat = new MeshLambertMaterial({ color: '#fffdfb', emissive: '#f6e6de', emissiveIntensity: 0.35, transparent: true });
    this.cloud = new Group();
    const puff = new SphereGeometry(1, 16, 12);
    for (const [x, y, z, r] of [
      [0, 0, 0, 0.32],
      [0.04, 0.09, 0.19, 0.24],
      [0.01, 0.07, -0.2, 0.25],
      [-0.06, 0.16, 0.04, 0.22],
      [0.07, -0.04, 0.33, 0.16],
      [0.06, -0.04, -0.33, 0.17],
    ]) {
      const m = new Mesh(puff, this.cloudMat);
      m.position.set(x, y, z);
      m.scale.setScalar(r * 0.72);
      this.cloud.add(m);
    }
    this.cloud.visible = false;
    this.scene.add(this.cloud);
    // contact distance: the nose of the cross (2.7 model units ahead, scaled) plus the cloud radius
    this.contactGap = (2.7 * 0.2 + 0.22) / this.curve.getLength();

    // a small floating print beside the path at every stop: memories waiting along the route
    this.markerTex = this.makeMarkerTexture();
    const up = new Vector3(0, 1, 0);
    const side = new Vector3();
    for (const l of lanterns) {
      const sp = new Sprite(new SpriteMaterial({ map: this.markerTex, transparent: true, depthWrite: false, opacity: 0 }));
      const u = Math.min(l.u + 0.004, 1);
      const p = this.curve.getPointAt(u);
      side.crossVectors(this.curve.getTangentAt(u), up).normalize();
      p.addScaledVector(side, l.side * 1.15).addScaledVector(up, 0.75);
      sp.position.copy(p);
      sp.scale.set(0.5, 0.62, 1);
      this.markers.push(sp);
      this.scene.add(sp);
    }

    this.scene.add(new HemisphereLight('#fffaf2', '#e6cbbd', 1.25));
    const sun = new DirectionalLight('#fff4e4', 1.2);
    sun.position.set(3, 6, 5);
    this.scene.add(sun);

    this.resize();
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVis);
    this.placeCamera();
    this.start();
  }

  // ---------- construction ----------

  private makeSky() {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const m = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTop: { value: this.live.top },
        uBottom: { value: this.live.bottom },
        uHorizon: { value: this.live.horizon },
        uStrength: { value: 0 },
        uFocus: { value: 0 },
        uTime: { value: 0 },
        uAspect: { value: 1 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uBottom, uHorizon;
        uniform float uStrength, uFocus, uTime, uAspect;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
          // horizon glow: a wide soft ellipse just below centre
          vec2 h = vec2((vUv.x - 0.5) * uAspect * 0.9, (vUv.y - 0.40) * 2.6);
          float glow = exp(-dot(h, h) * 2.2);
          col += uHorizon * glow * uStrength * 0.62;
          // vignette
          vec2 v = vUv - 0.5;
          col *= 1.0 - dot(v, v) * 0.22;
          col = mix(col, col * vec3(0.42, 0.36, 0.32), uFocus * 0.7);
          // film grain (hides banding in dark gradients)
          col += (hash(vUv * 900.0 + fract(uTime) * 61.0) - 0.5) * 0.018;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const mesh = new Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;
    return mesh;
  }

  private makeThread(n: number) {
    const pos = new Float32Array(n * 3);
    const t = new Float32Array(n);
    const seed = new Float32Array(n);
    const size = new Float32Array(n);
    const up = new Vector3(0, 1, 0);
    const side = new Vector3();
    for (let i = 0; i < n; i++) {
      const tt = i / n + Math.random() / n;
      const p = this.curve.getPointAt(Math.min(tt, 1));
      const tan = this.curve.getTangentAt(Math.min(tt, 1));
      side.crossVectors(tan, up).normalize();
      const stray = Math.random() < 0.12;
      const r = stray ? 0.15 + Math.random() * 0.9 : Math.pow(Math.random(), 2) * 0.05;
      const a = Math.random() * Math.PI * 2;
      p.addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r * 0.7);
      pos.set([p.x, p.y, p.z], i * 3);
      t[i] = tt;
      seed[i] = Math.random();
      size[i] = stray ? 0.5 + Math.random() * 0.6 : 0.8 + Math.random() * 0.7;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aT', new BufferAttribute(t, 1));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    g.setAttribute('aSize', new BufferAttribute(size, 1));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: {
        uColor: { value: this.live.thread },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
        uFlow: { value: 1 },
        uReveal: { value: 0 },
        uCamU: { value: 0 },
        uPixel: { value: this.dpr },
      },
      vertexShader: /* glsl */ `
        attribute float aT, aSeed, aSize;
        uniform float uTime, uFlow, uReveal, uCamU, uPixel, uIntensity;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y += sin(uTime * 0.5 + aSeed * 40.0) * 0.025;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = max(-mv.z, 0.01);
          float fog = exp(-dist * 0.022);
          float near = smoothstep(0.2, 1.6, dist);
          float revealed = 1.0 - smoothstep(uReveal - 0.01, uReveal, aT);
          // light travelling forward along the thread
          float pulse = 0.5 + 0.5 * sin(aT * 1400.0 - uTime * uFlow * 3.0 + aSeed * 3.0);
          float wave = 0.75 + 0.25 * sin(aT * 90.0 - uTime * uFlow * 0.8);
          // the path already travelled glows a little warmer
          float travelled = 1.0 + 0.35 * step(aT, uCamU);
          vAlpha = fog * near * revealed * uIntensity * (0.45 + 0.75 * pulse) * wave * travelled * 1.3;
          gl_PointSize = clamp(aSize * uPixel * (46.0 / dist), 1.6 * uPixel, 30.0 * uPixel);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: SOFT_POINT_FRAG,
    });
    const pts = new Points(g, m);
    pts.frustumCulled = false;
    return pts;
  }

  private makeLanterns(list: Lantern[]) {
    const n = Math.max(list.length, 1);
    const pos = new Float32Array(n * 3);
    const str = new Float32Array(n);
    const seed = new Float32Array(n);
    const up = new Vector3(0, 1, 0);
    const side = new Vector3();
    list.forEach((l, i) => {
      const u = Math.min(l.u + 0.006, 1);
      const p = this.curve.getPointAt(u);
      const tan = this.curve.getTangentAt(u);
      side.crossVectors(tan, up).normalize();
      p.addScaledVector(side, l.side * 1.6).addScaledVector(up, 0.9);
      pos.set([p.x, p.y, p.z], i * 3);
      str[i] = 0.9;
      seed[i] = Math.random();
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aStrength', new BufferAttribute(str, 1));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: {
        uColor: { value: new Color('#c9975a') },
        uTime: { value: 0 },
        uPixel: { value: this.dpr },
        uIntensity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aStrength, aSeed;
        uniform float uTime, uPixel, uIntensity;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = max(-mv.z, 0.01);
          float fog = exp(-dist * 0.035);
          float near = smoothstep(0.6, 3.0, dist);
          float breathe = 0.75 + 0.25 * sin(uTime * 0.9 + aSeed * 6.28);
          vAlpha = fog * near * breathe * uIntensity * (0.5 + aStrength);
          gl_PointSize = min((60.0 + aStrength * 90.0) * uPixel / dist, 120.0 * uPixel);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = smoothstep(0.08, 0.0, d);
          float halo = smoothstep(0.5, 0.0, d);
          halo = halo * halo * 0.55;
          gl_FragColor = vec4(uColor, clamp((core + halo) * vAlpha, 0.0, 1.0));
        }
      `,
    });
    const pts = new Points(g, m);
    pts.frustumCulled = false;
    if (!list.length) pts.visible = false;
    return pts;
  }

  private makeDust(n: number) {
    const box = new Vector3(14, 9, 34);
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos.set([Math.random() * box.x, Math.random() * box.y, Math.random() * box.z], i * 3);
      seed[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: {
        uColor: { value: this.live.dust },
        uTime: { value: 0 },
        uCam: { value: new Vector3() },
        uBox: { value: box },
        uPixel: { value: this.dpr },
        uIntensity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uPixel, uIntensity;
        uniform vec3 uCam, uBox;
        varying float vAlpha;
        void main() {
          vec3 p = position + vec3(sin(uTime * 0.13 + aSeed * 30.0) * 0.6, uTime * 0.06 * (aSeed - 0.3), cos(uTime * 0.1 + aSeed * 20.0) * 0.4);
          p = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = max(-mv.z, 0.01);
          float fade = smoothstep(0.5, 2.5, dist) * (1.0 - smoothstep(10.0, 17.0, dist));
          float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0);
          vAlpha = fade * tw * uIntensity * 0.7;
          gl_PointSize = clamp((0.6 + aSeed * 1.4) * uPixel * (24.0 / dist), 1.0 * uPixel, 12.0 * uPixel);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: SOFT_POINT_FRAG,
    });
    const pts = new Points(g, m);
    pts.frustumCulled = false;
    return pts;
  }

  // ---------- api ----------

  setMood(mood: Mood) {
    this.target = LivePalette.from(PALETTES[mood]);
  }
  setTarget(u: number, immediate = false) {
    this.uTarget = u;
    if (immediate) {
      this.u = u;
      this.placeCamera();
    }
  }
  setRiding(on: boolean) {
    this.follow = on ? 6 : 1.5;
  }
  setReveal(v: number) {
    this.revealTarget = v;
  }
  setFocus(f: number) {
    this.focusTarget = f;
  }
  setReducedMotion(r: boolean) {
    this.reduced = r;
  }
  setIdle(idle: boolean) {
    this.idle = idle;
  }
  setFrame(f: Frame) {
    this.frameName = f;
  }
  setRidersVisible(v: boolean) {
    this.riders.group.visible = v;
  }
  setDriver(who: 'gia' | 'jesus', animate: boolean) {
    this.riders.setDriver(who, animate && !this.reduced);
  }
  setObstacle(u: number | null, onContact?: () => void) {
    if (u == null) {
      this.cloudU = null;
      this.onContact = null;
      return;
    }
    this.cloudU = u;
    this.cloudGone = 0;
    this.onContact = onContact ?? null;
    const uc = Math.min(u + this.contactGap, 1);
    const p = this.curve.getPointAt(uc);
    // a touch to the far side of the path, so it never hides the driver from the side-on camera
    this.side.crossVectors(this.curve.getTangentAt(uc), this.up).normalize();
    p.addScaledVector(this.side, -0.12);
    this.cloud.position.set(p.x, p.y + 0.12, p.z);
    this.cloud.visible = true;
  }
  react() {
    this.riders.react();
    this.cloudSquash = 1;
  }
  wave(ms: number) {
    this.waveUntil = performance.now() + ms;
  }
  /** Screen position (CSS px) just above a rider's head, for speech bubbles. */
  getAnchor(who: Rider) {
    if (!this.riders.group.visible) return null;
    this.riders.heads[who].getWorldPosition(this.anchor);
    this.anchor.y += 0.09;
    this.anchor.project(this.camera);
    if (this.anchor.z > 1) return null;
    return { x: ((this.anchor.x + 1) / 2) * innerWidth, y: ((1 - this.anchor.y) / 2) * innerHeight };
  }
  /** The riders' bounding box on screen (CSS px). */
  getRidersRect() {
    if (!this.riders.group.visible) return null;
    this.box.setFromObject(this.riders.group.children[0]); // the riders and the cross, without the trail
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      this.tmpA.set(i & 1 ? this.box.max.x : this.box.min.x, i & 2 ? this.box.max.y : this.box.min.y, i & 4 ? this.box.max.z : this.box.min.z).project(this.camera);
      const x = ((this.tmpA.x + 1) / 2) * innerWidth;
      const y = ((1 - this.tmpA.y) / 2) * innerHeight;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  // ---------- loop ----------

  private start() {
    cancelAnimationFrame(this.raf);
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min((now - this.last) / 1000, 0.1);
      this.frame++;
      if (this.idle && this.frame % 2) return; // half rate while a video has focus
      this.last = now;
      this.tick(dt, now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private tick(dt: number, now: number) {
    const k = (rate: number) => 1 - Math.exp(-dt * rate);
    this.time += dt * (this.reduced ? 0.35 : 1);

    // ease colour and light
    this.live.lerp(this.target, k(0.9));
    this.reveal += (this.revealTarget - this.reveal) * k(this.revealTarget > this.reveal ? 0.35 : 3);
    this.focus += (this.focusTarget - this.focus) * k(2.5);

    // camera travel: a soft spring, gentler with reduced motion
    let goal = Math.min(Math.max(this.uTarget, 0), 0.985);
    // the cloud blocks the path until it drifts away
    const stopAt = this.cloudU;
    if (stopAt != null) goal = Math.min(goal, stopAt);
    this.u += (goal - this.u) * k(this.reduced ? Math.max(0.8, this.follow * 0.6) : this.follow);
    if (stopAt != null && this.onContact && this.u > stopAt - 0.0004 && this.uTarget > stopAt) {
      const fire = this.onContact;
      this.onContact = null;
      fire();
    }
    this.tickCloud(dt);
    this.tickMarkers(dt);
    // travel speed drives how alive the riders are (still when stopped)
    const v = Math.abs(this.u - this.lastU) / Math.max(dt, 1e-3);
    this.lastU = this.u;
    this.speed += (Math.min(v / 0.004, 1) - this.speed) * k(4);
    const f = (this.wide && FRAMES_WIDE[this.frameName]) || FRAMES[this.frameName];
    const fr = k(this.reduced ? 2.5 : 1.1);
    this.camOff.x += (f.off[0] - this.camOff.x) * fr;
    this.camOff.y += (f.off[1] - this.camOff.y) * fr;
    this.camOff.z += (f.off[2] - this.camOff.z) * fr;
    this.lookOff.x += (f.look[0] - this.lookOff.x) * fr;
    this.lookOff.y += (f.look[1] - this.lookOff.y) * fr;
    this.lookOff.z += (f.look[2] - this.lookOff.z) * fr;
    this.placeCamera();
    this.riders.update(dt, this.idle ? 0 : this.speed, this.time, now < this.waveUntil, this.reduced);

    const l = this.live;
    const su = (this.sky.material as ShaderMaterial).uniforms;
    su.uStrength.value = l.horizonStrength;
    su.uFocus.value = this.focus;
    su.uTime.value = this.time;

    const tu = (this.thread.material as ShaderMaterial).uniforms;
    tu.uIntensity.value = l.threadIntensity * (1 - this.focus * 0.7);
    tu.uTime.value = this.time;
    tu.uFlow.value = l.flow * (1 + this.speed * 1.5);
    tu.uReveal.value = this.reveal;
    tu.uCamU.value = this.u;

    const lu = (this.lanterns.material as ShaderMaterial).uniforms;
    lu.uTime.value = this.time;
    lu.uIntensity.value = Math.min(this.reveal * 1.5, 1) * (1 - this.focus * 0.8) * Math.min(l.threadIntensity, 1);

    const du = (this.dust.material as ShaderMaterial).uniforms;
    du.uTime.value = this.time;
    du.uCam.value.copy(this.camera.position);
    du.uIntensity.value = l.dustAmount * (1 - this.focus * 0.6);

    this.renderer.render(this.scene, this.camera);
    this.adapt(dt, now);
  }

  /** The cloud squashes when bumped, then drifts up and away once cleared. */
  private tickCloud(dt: number) {
    if (!this.cloud.visible) return;
    this.cloudSquash = Math.max(0, this.cloudSquash - dt * 1.6);
    const sq = this.reduced ? 0 : Math.sin(this.cloudSquash * Math.PI) * 0.22;
    if (this.cloudU == null) this.cloudGone = Math.min(1, this.cloudGone + dt / 1.8);
    const g = this.cloudGone;
    this.cloud.scale.set(1 + sq, 1 - sq * 0.8, 1 + sq).multiplyScalar(1 - g * 0.55);
    this.cloud.position.y += g > 0 ? dt * 0.9 * g : Math.sin(this.time * 1.4) * 0.0008;
    this.cloudMat.opacity = 1 - g;
    if (g >= 1) this.cloud.visible = false;
  }

  /** Stop markers fade in as the riders approach along the road, and out once passed or stopped. */
  private tickMarkers(dt: number) {
    const tmp = this.tmpB;
    for (const m of this.markers) {
      tmp.copy(m.position).applyMatrix4(this.camera.matrixWorldInverse);
      const d = -tmp.z;
      // only along the road: at a stop the memory itself is on screen, so the markers step aside
      const riding = this.follow > 2 ? 1 : 0;
      const want = d < 0.6 ? 0 : Math.min(1, (d - 0.6) / 1.2) * (1 - Math.min(1, Math.max(0, (d - 14) / 8))) * (1 - this.focus) * riding;
      const mat = m.material as SpriteMaterial;
      mat.opacity += (want * 0.92 - mat.opacity) * (1 - Math.exp(-dt * 3));
    }
  }

  private makeMarkerTexture() {
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 200;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(160,120,80,0.16)';
    g.fillRect(10, 12, 144, 182);
    g.fillStyle = '#fffdf9';
    g.fillRect(6, 6, 144, 182);
    const grad = g.createLinearGradient(0, 18, 0, 150);
    grad.addColorStop(0, '#f8e3da');
    grad.addColorStop(1, '#f3d7b8');
    g.fillStyle = grad;
    g.fillRect(18, 18, 120, 128);
    g.fillStyle = 'rgba(201,160,99,0.9)';
    g.beginPath();
    g.arc(78, 82, 9, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(154,116,64,0.55)';
    g.lineWidth = 2;
    g.strokeRect(6, 6, 144, 182);
    return new CanvasTexture(c);
  }

  /** Riders sit on the thread at u; the camera is placed relative to them by the current framing. */
  private placeCamera() {
    const u = this.u;
    const p = this.curve.getPointAt(u, this.tmpA);
    this.curve.getTangentAt(Math.min(u, 1), this.fwd);
    // keep the riders upright: flatten the heading, keep only a little pitch
    this.fwd.y *= 0.3;
    this.fwd.normalize();
    this.side.crossVectors(this.fwd, this.up).normalize();
    const upO = this.tmpB.crossVectors(this.side, this.fwd).normalize();
    const g = this.riders.group;
    g.position.copy(p);
    g.position.y += 0.03;
    this.basis.makeBasis(this.fwd, upO, this.side);
    g.quaternion.setFromRotationMatrix(this.basis);

    const o = this.camOff;
    const l = this.lookOff;
    const cam = this.camera.position;
    cam.copy(p).addScaledVector(this.fwd, o.x).addScaledVector(this.up, o.y).addScaledVector(this.side, o.z);
    const lx = p.x + this.fwd.x * l.x + this.side.x * l.z;
    const ly = p.y + l.y + this.fwd.y * l.x;
    const lz = p.z + this.fwd.z * l.x + this.side.z * l.z;
    this.camera.lookAt(lx, ly, lz);
  }

  /** Lower resolution, then particle count, if frames are slow. */
  private adapt(dt: number, _now: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (this.idle || document.hidden) return;
    if (avg > 0.024 && this.degraded < 4) {
      this.degraded++;
      if (this.dpr > 1) {
        this.dpr = Math.max(1, this.dpr - 0.25);
        this.renderer.setPixelRatio(this.dpr);
        this.resize();
      } else {
        this.thread.geometry.setDrawRange(0, Math.floor(this.threadCount * 0.6));
        this.dust.geometry.setDrawRange(0, Math.floor(this.dustCount * 0.5));
      }
    }
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.wide = w > h;
    // keep the horizontal field roughly constant so portrait phones still see the path wind
    this.camera.fov = w < h ? 62 : 50;
    this.camera.updateProjectionMatrix();
    (this.sky.material as ShaderMaterial).uniforms.uAspect.value = w / h;
    for (const o of [this.thread, this.lanterns, this.dust]) (o.material as ShaderMaterial).uniforms.uPixel.value = this.dpr;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVis);
    for (const o of [this.sky, this.thread, this.lanterns, this.dust]) {
      o.geometry.dispose();
      (o.material as ShaderMaterial).dispose();
    }
    this.riders.dispose();
    this.cloud.children.forEach((m) => (m as Mesh).geometry.dispose());
    this.cloudMat.dispose();
    this.markers.forEach((m) => (m.material as SpriteMaterial).dispose());
    this.markerTex.dispose();
    this.renderer.dispose();
  }
}
