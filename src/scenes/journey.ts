import type { RoadData } from '../experience/beats';
import { picture } from '../media/media';
import { h, put, words } from '../utils/dom';
import { speechBubble } from './bubble';
import { shell } from './text';
import type { SceneFactory } from './types';

/**
 * THE OPENING (present day): Gia at the wheel, waving.
 * Her bubble tracks her head in the 3D world.
 */
export const openingScene: SceneFactory = (beat, ctx) => {
  const d = beat.data as { kicker: string; bubble: string };
  const el = shell('opening');
  const bubble = speechBubble(d.bubble, 'gia', ctx.world);
  put(el, h('p.kicker.op-kicker.rv', { style: { '--d': 600 }, text: d.kicker }), bubble.el);
  let t = 0;
  return {
    el,
    enter() {
      ctx.world.wave(5200);
      t = window.setTimeout(() => bubble.show(), ctx.reduced ? 200 : 1100);
    },
    leave() {
      bubble.hide();
    },
    dispose() {
      clearTimeout(t);
      bubble.dispose();
    },
  };
};

/**
 * A ROAD: the stretch between two stops. The riders and the ride control do
 * the work; this scene only carries an optional line.
 */
export const roadScene: SceneFactory = (beat, ctx) => {
  const r = beat.road as RoadData;
  const el = shell('road');
  if (r.line) put(el, h('p.road-line.rv-words', { style: { '--d0': 300 } }, [words(r.line)]));
  ctx.lock('all');
  return { el, hint: false };
};

/** THE FINALE: a current photo of Gia and three lines. Nothing comes after it. */
export const finaleScene: SceneFactory = (beat, ctx) => {
  const d = beat.data;
  const el = shell('finale');
  put(
    el,
    h('div.fi-inner', {}, [
      h('figure.fi-photo.rv-depth', { style: { '--d': 500 } }, [picture(d.photo)]),
      h('h1.fi-headline.rv-words', { style: { '--d0': 1500 } }, [words(d.headline)]),
      h('p.fi-welcome.rv', { style: { '--d': 3000 }, text: d.welcome }),
      d.verse
        ? h('figure.fi-verse.rv', { style: { '--d': 3700 } }, [h('blockquote', { text: `“${d.verse.text}”` }), h('figcaption', { text: d.verse.ref })])
        : null,
      h('p.fi-sign.rv', { style: { '--d': 4800 } }, [h('span.fi-closing', { text: d.closing }), ' ', h('span.fi-signature', { text: d.signature })]),
    ]),
  );
  ctx.lock('all');
  return {
    el,
    hint: false,
    enter() {
      ctx.audio.resolve();
    },
  };
};
