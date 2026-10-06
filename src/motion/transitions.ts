import type { TransitionName } from '../content/types';

/**
 * TRANSITION VOCABULARY
 * Every move between beats is one of these. They are built on the Web
 * Animations API (no animation library) and only animate opacity, transform
 * and — on capable devices — a small blur, which keeps them on the GPU.
 *
 *   depth     the moment passes behind the camera; the next arrives from distance
 *   through   the camera passes through a photograph into what's behind it
 *   light     light fills the viewport, then recedes onto the next moment
 *   dark      everything falls into darkness; the next environment is revealed
 *   drift     the world reorients sideways
 *   dissolve  typography breaks into motes and drifts away
 *   cut       instant
 */

export const EASE = {
  out: 'cubic-bezier(.5,0,.75,0)',
  in: 'cubic-bezier(.16,.84,.3,1)',
  inout: 'cubic-bezier(.65,0,.35,1)',
};

interface Opts {
  reduced: boolean;
  blur: boolean;
  lightLayer: HTMLElement;
}

function run(el: Element | null, frames: Keyframe[], o: KeyframeAnimationOptions): Promise<void> {
  if (!el) return Promise.resolve();
  const a = el.animate(frames, { fill: 'both', ...o });
  return a.finished.then(
    () => {},
    () => {},
  );
}

const blurF = (on: boolean, px: number) => (on ? `blur(${px}px)` : 'none');

export const DURATION: Record<TransitionName, number> = {
  depth: 1100,
  through: 1400,
  light: 1700,
  dark: 2100,
  drift: 1200,
  dissolve: 1500,
  cut: 0,
};

/** Delay (ms) after which the incoming scene is visibly present — scenes start their own reveals then. */
export const ARRIVAL: Record<TransitionName, number> = {
  depth: 250,
  through: 700,
  light: 850,
  dark: 1100,
  drift: 250,
  dissolve: 600,
  cut: 0,
};

export async function transition(name: TransitionName, outEl: HTMLElement | null, inEl: HTMLElement, dir: 1 | -1, o: Opts): Promise<void> {
  if (o.reduced) {
    await Promise.all([
      run(outEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'linear' }),
      run(inEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 300, easing: 'linear' }),
    ]);
    return finish(inEl);
  }
  if (dir === -1 && name !== 'cut') name = 'depth';

  const b = o.blur;
  switch (name) {
    case 'cut':
      return finish(inEl);

    case 'depth': {
      const f = dir; // forward: things come toward camera; back: reverse
      await Promise.all([
        run(
          outEl,
          [
            { opacity: 1, transform: 'translateZ(0) scale(1)', filter: blurF(b, 0) },
            { opacity: 0, transform: `scale(${f > 0 ? 1.28 : 0.84})`, filter: blurF(b, 6) },
          ],
          { duration: 850, easing: EASE.out },
        ),
        run(
          inEl,
          [
            { opacity: 0, transform: `scale(${f > 0 ? 0.86 : 1.22})`, filter: blurF(b, 5) },
            { opacity: 1, transform: 'scale(1)', filter: blurF(b, 0) },
          ],
          { duration: 1100, delay: 200, easing: EASE.in },
        ),
      ]);
      return finish(inEl);
    }

    case 'through':
      await Promise.all([
        run(
          outEl,
          [
            { opacity: 1, transform: 'scale(1)', offset: 0 },
            { opacity: 1, transform: 'scale(1.9)', offset: 0.55 },
            { opacity: 0, transform: 'scale(2.8)', offset: 1 },
          ],
          { duration: 1300, easing: 'cubic-bezier(.6,0,.9,.4)' },
        ),
        run(
          inEl,
          [
            { opacity: 0, transform: 'scale(.94)', filter: blurF(b, 4) },
            { opacity: 1, transform: 'scale(1)', filter: blurF(b, 0) },
          ],
          { duration: 1100, delay: 700, easing: EASE.in },
        ),
      ]);
      return finish(inEl);

    case 'light':
      await Promise.all([
        run(o.lightLayer, [{ opacity: 0 }, { opacity: 0.92, offset: 0.45 }, { opacity: 0 }], { duration: 1900, easing: 'ease-in-out' }),
        run(outEl, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.06)' }], { duration: 800, easing: EASE.out }),
        run(inEl, [{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1300, delay: 850, easing: EASE.in }),
      ]);
      return finish(inEl);

    case 'dark':
      await Promise.all([
        run(outEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-in' }),
        run(inEl, [{ opacity: 0, transform: 'scale(1.025)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1500, delay: 1100, easing: 'ease-out' }),
      ]);
      return finish(inEl);

    case 'drift':
      await Promise.all([
        run(
          outEl,
          [
            { opacity: 1, transform: 'translateX(0) rotateY(0)' },
            { opacity: 0, transform: 'translateX(-22%) rotateY(16deg)' },
          ],
          { duration: 900, easing: EASE.out },
        ),
        run(
          inEl,
          [
            { opacity: 0, transform: 'translateX(22%) rotateY(-16deg)' },
            { opacity: 1, transform: 'translateX(0) rotateY(0)' },
          ],
          { duration: 1200, delay: 200, easing: EASE.in },
        ),
      ]);
      return finish(inEl);

    case 'dissolve': {
      const hasChars = !!outEl?.querySelector('.c');
      if (outEl && hasChars) outEl.classList.add('is-dissolving');
      await Promise.all([
        hasChars
          ? run(outEl, [{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 1300 })
          : run(outEl, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.15)' }], { duration: 900, easing: EASE.out }),
        run(
          inEl,
          [
            { opacity: 0, transform: 'scale(.92)', filter: blurF(b, 6) },
            { opacity: 1, transform: 'scale(1)', filter: blurF(b, 0) },
          ],
          { duration: 1300, delay: 600, easing: EASE.in },
        ),
      ]);
      return finish(inEl);
    }
  }
}

function finish(inEl: HTMLElement) {
  // drop the animation layers so the scene is back to plain CSS (frees GPU memory)
  inEl.getAnimations().forEach((a) => a.cancel());
}
