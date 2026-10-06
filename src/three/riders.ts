import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  type BufferGeometry as BG,
} from 'three';
import { rideLook } from '../content/ride';

/**
 * THE RIDERS — Gia, Winston and Jesus on the cross.
 * Built once, kept for the whole experience (never remounted).
 * Stylised low-poly figures (~30 small meshes, Lambert-lit).
 *
 * Model space: +x is forward (the top of the cross leads), +y up.
 * Movement is driven by travel speed: still when stopped, alive when riding.
 * Gia drives at first; Jesus takes the wheel after the bump (setDriver).
 */

type Look = { skin: string; hair: string; clothes?: string; robe?: string; sash?: string };

export interface Riders {
  group: Group;
  /** Heads, for speech bubbles. */
  heads: Record<'gia' | 'jesus' | 'winston', Group>;
  update(dt: number, speed: number, time: number, wave: boolean, reduced: boolean): void;
  /** Who drives. animate = Gia and Jesus swap seats with a little hop. */
  setDriver(who: 'gia' | 'jesus', animate: boolean): void;
  /** Everyone startles: heads back, arms up, a small jolt. */
  react(): void;
  dispose(): void;
}

export function buildRiders(trailCount: number): Riders {
  const geos: BG[] = [];
  const mats = new Map<string, MeshLambertMaterial>();
  const mat = (c: string) => {
    if (!mats.has(c)) mats.set(c, new MeshLambertMaterial({ color: c }));
    return mats.get(c)!;
  };
  const mesh = (g: BG, color: string, x = 0, y = 0, z = 0) => {
    geos.push(g);
    const m = new Mesh(g, mat(color));
    m.position.set(x, y, z);
    return m;
  };

  const group = new Group();
  const body = new Group(); // tilts / lifts while riding
  group.add(body);

  // the cross, lying along the direction of travel
  body.add(mesh(new BoxGeometry(5.4, 0.3, 0.46), rideLook.cross));
  body.add(mesh(new BoxGeometry(0.46, 0.3, 2.5), rideLook.cross, 1.25, 0, 0));

  const seatY = 0.15;
  const figure = (look: Look, x: number, opts: { longHair?: boolean; beard?: boolean; robe?: boolean; scale?: number } = {}) => {
    const g = new Group();
    const cloth = look.robe ?? look.clothes ?? '#ccc';
    for (const z of [-0.2, 0.2]) {
      const leg = mesh(new CapsuleGeometry(0.09, 0.42, 3, 8), opts.robe ? cloth : '#5c5552', 0.12, seatY - 0.12, z * 1.3);
      leg.rotation.x = z > 0 ? -0.5 : 0.5;
      g.add(leg);
    }
    g.add(mesh(new CylinderGeometry(0.22, opts.robe ? 0.38 : 0.3, opts.robe ? 0.95 : 0.8, 14), cloth, 0, seatY + (opts.robe ? 0.42 : 0.4), 0));
    if (look.sash) {
      const sash = mesh(new TorusGeometry(0.27, 0.035, 6, 18), look.sash, 0, seatY + 0.5, 0);
      sash.rotation.x = Math.PI / 2;
      g.add(sash);
    }
    const arms: Mesh[] = [];
    for (const z of [-0.26, 0.26]) {
      const arm = mesh(new CapsuleGeometry(0.075, 0.42, 3, 8), cloth, 0.18, seatY + 0.6, z);
      arm.rotation.z = -1.1;
      g.add(arm);
      arms.push(arm);
    }
    const head = new Group();
    head.position.set(0, seatY + 1.08, 0);
    head.add(mesh(new SphereGeometry(0.24, 18, 14), look.skin));
    const hair = mesh(new SphereGeometry(0.255, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), look.hair, -0.02, 0.03, 0);
    hair.rotation.z = 0.35;
    head.add(hair);
    if (opts.longHair) head.add(mesh(new CapsuleGeometry(0.17, 0.42, 3, 10), look.hair, -0.17, -0.3, 0));
    if (opts.beard) {
      const beard = mesh(new SphereGeometry(0.15, 12, 10), look.hair, 0.12, -0.16, 0);
      beard.scale.set(0.8, 0.7, 1.1);
      head.add(beard);
    }
    for (const z of [-0.085, 0.085]) head.add(mesh(new SphereGeometry(0.028, 8, 6), '#2a1f1a', 0.22, 0.03, z));
    g.add(head);
    g.scale.setScalar(opts.scale ?? 1);
    g.position.x = x;
    return { g, head, arms };
  };

  const FRONT = 2.15;
  const MIDDLE = 1.2;
  const gia = figure(rideLook.gia, FRONT, { longHair: true, scale: 0.92 });
  const jesus = figure(rideLook.jesus as Look, MIDDLE, { longHair: true, beard: true, robe: true, scale: 1.04 });
  const win = figure(rideLook.winston, 0.15);
  body.add(gia.g, jesus.g, win.g);

  // a little steering wheel for the new driver
  const wheel = mesh(new TorusGeometry(0.2, 0.035, 8, 22), '#3b2d25', 2.55, seatY + 0.72, 0);
  wheel.rotation.y = Math.PI / 2;
  wheel.rotation.x = 0.25;
  body.add(wheel);
  body.add(mesh(new CylinderGeometry(0.03, 0.03, 0.55, 8), '#3b2d25', 2.6, seatY + 0.42, 0));

  // soft light behind Jesus' head
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const gx = c.getContext('2d')!;
  const grad = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,232,180,0.95)');
  grad.addColorStop(1, 'rgba(255,232,180,0)');
  gx.fillStyle = grad;
  gx.fillRect(0, 0, 64, 64);
  const glowTex = new CanvasTexture(c);
  const glowMat = new SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false });
  const glow = new Sprite(glowMat);
  glow.scale.set(1.4, 1.4, 1);
  glow.position.set(-0.05, 0, -0.05);
  jesus.head.add(glow);

  // light trail streaming behind while riding
  const N = trailCount;
  const pos = new Float32Array(N * 3);
  const seeds = new Float32Array(N).map(() => Math.random());
  const trailGeo = new BufferGeometry();
  trailGeo.setAttribute('position', new BufferAttribute(pos, 3));
  geos.push(trailGeo);
  const trailMat = new PointsMaterial({ color: '#c9975a', size: 0.07, transparent: true, opacity: 0, depthWrite: false });
  const trail = new Points(trailGeo, trailMat);
  trail.frustumCulled = false;
  group.add(trail);

  let flow = 0;
  let energy = 0; // eased speed → how "alive" the riders are
  let swap = 0; // 0 = Gia drives, 1 = Jesus drives
  let swapTarget = 0;
  let startle = 99; // seconds since the last startle
  const ease = (t: number) => t * t * (3 - 2 * t);
  return {
    group,
    heads: { gia: gia.head, jesus: jesus.head, winston: win.head },
    setDriver(who, animate) {
      swapTarget = who === 'jesus' ? 1 : 0;
      if (!animate) swap = swapTarget;
    },
    react() {
      startle = 0;
    },
    update(dt, speed, time, wave, reduced) {
      energy += (Math.min(speed, 1) - energy) * (1 - Math.exp(-dt * 3));
      const e = reduced ? energy * 0.25 : energy;
      flow += dt * (0.25 + energy * 1.6);
      startle += dt;
      // the startle: quick rise, gentle settle (about a second)
      const st = reduced ? 0 : startle < 0.12 ? startle / 0.12 : Math.exp(-(startle - 0.12) * 3.2);
      // seat swap: Gia and Jesus pass each other on either side with a small hop
      if (swap !== swapTarget) {
        const step = dt / 1.5;
        swap = swapTarget > swap ? Math.min(swapTarget, swap + step) : Math.max(swapTarget, swap - step);
      }
      const s = ease(swap);
      const arc = Math.sin(Math.PI * s);
      gia.g.position.x = FRONT + (MIDDLE - FRONT) * s;
      jesus.g.position.x = MIDDLE + (FRONT - MIDDLE) * s;
      gia.g.position.z = arc * 0.42;
      jesus.g.position.z = -arc * 0.42;
      // only while moving: a gentle lift and lean. When stopped: completely still.
      body.position.y = Math.sin(time * 6) * 0.05 * e + st * 0.08;
      body.position.x = -st * 0.18;
      body.rotation.z = -0.05 * e + st * 0.06;
      for (const [f, ph] of [
        [gia, 0],
        [jesus, 1.3],
        [win, 2.4],
      ] as const) {
        f.g.position.y = Math.abs(Math.sin(time * 6 + ph)) * 0.04 * e + arc * 0.5 + st * 0.12;
        f.head.rotation.z = st * 0.42;
        f.arms[0].rotation.z = -1.1 - st * 1.3;
      }
      // the driver's hands reach for the wheel
      const giaDrives = 1 - s;
      wheel.rotation.z = Math.sin(time * 2.2) * 0.25 * e;
      // Gia waves while she announces her news
      gia.arms[1].rotation.z = wave ? -2.6 + Math.sin(time * 9) * (reduced ? 0.1 : 0.35) : -1.1 - st * 1.3 - giaDrives * 0.25;
      gia.arms[1].position.y = seatY + (wave ? 0.85 : 0.6);
      jesus.arms[1].rotation.z = -1.1 - st * 1.3 - s * 0.25;
      win.arms[1].rotation.z = -1.1 - st * 1.3;
      // the trail fades in only while riding
      trailMat.opacity = 0.75 * Math.min(energy * 2, 1);
      if (trailMat.opacity > 0.01) {
        for (let i = 0; i < N; i++) {
          const p = (seeds[i] + flow * 0.4) % 1;
          pos[i * 3] = -2.7 - p * 6;
          pos[i * 3 + 1] = -0.1 + Math.sin(seeds[i] * 40 + time) * 0.12 * (1 - p);
          pos[i * 3 + 2] = (seeds[i] - 0.5) * 0.5 * (1 + p);
        }
        trailGeo.attributes.position.needsUpdate = true;
      }
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      glowTex.dispose();
      glowMat.dispose();
      trailMat.dispose();
    },
  };
}
