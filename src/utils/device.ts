/**
 * Picks a visual quality tier once at startup. The WebGL world also
 * degrades itself at runtime if frames are slow.
 */
export interface Quality {
  tier: 'high' | 'medium' | 'low' | 'none';
  maxDpr: number;
  threadParticles: number;
  dustParticles: number;
  blur: boolean;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function detectQuality(): Quality {
  const params = new URLSearchParams(location.search);
  const forced = params.get('quality') as Quality['tier'] | null;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as any).deviceMemory || 4;
  const saveData = (navigator as any).connection?.saveData === true;
  let tier: Quality['tier'] = !hasWebGL() ? 'none' : cores >= 6 && mem >= 4 ? 'high' : cores >= 4 ? 'medium' : 'low';
  if (saveData && tier === 'high') tier = 'medium';
  if (forced) tier = forced;
  switch (tier) {
    case 'high':
      return { tier, maxDpr: 1.5, threadParticles: 7000, dustParticles: 700, blur: true };
    case 'medium':
      return { tier, maxDpr: 1.25, threadParticles: 4500, dustParticles: 450, blur: true };
    case 'low':
      return { tier, maxDpr: 1, threadParticles: 2500, dustParticles: 250, blur: false };
    default:
      return { tier: 'none', maxDpr: 1, threadParticles: 0, dustParticles: 0, blur: false };
  }
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(`c20:${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(`c20:${key}`, value);
    } catch {
      /* private mode — ignore */
    }
  },
};
