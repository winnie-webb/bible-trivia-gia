import type { MediaItem } from '../content/types';
import { createPlayer, type Player } from '../media/media';
import { h } from '../utils/dom';
import type { SceneCtx } from './types';

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
const REPLAY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M5 4.5v5h5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * A video in the world: poster first, one clear play control, then native
 * controls once playing (scrubbing, volume, fullscreen).
 * It only ever plays when she chooses. Sound follows her choice at the gate
 * (muted if she entered quietly; the native control unmutes).
 * While playing: music ducks, the world dims, riding waits.
 */
export interface Playable {
  frame: HTMLElement;
  player: Player;
  pause(): void;
  dispose(): void;
}

export function playable(item: MediaItem, ctx: SceneCtx, host: HTMLElement, opts: { label?: string; focus?: number } = {}): Playable {
  const player = createPlayer(item);
  const play = h('button.vp-play', { type: 'button', 'aria-label': opts.label ?? 'Play video', html: PLAY_ICON });
  const replay = h('button.vp-replay', { type: 'button', 'aria-label': 'Play again', html: REPLAY_ICON });
  const frame = h(`div.vp.o-${item.orientation}`, { 'data-interactive': '' }, [player.el, play, replay]);
  const video = player.el.querySelector('video');

  play.addEventListener('click', () => {
    if (video) video.muted = !ctx.audio.enabled;
    player.play();
  });
  replay.addEventListener('click', () => player.restart());
  // tapping a playing placeholder pauses it (real videos use native controls)
  frame.addEventListener('click', (e) => {
    if (player.placeholder && e.target !== play && e.target !== replay && !player.paused) player.pause();
  });

  const unbind = ctx.audio.bindMedia(player as any);
  const onPlay = () => {
    host.classList.add('is-playing');
    host.classList.remove('is-ended');
    player.showControls(true);
    ctx.world.setFocus(opts.focus ?? 0.6);
    ctx.world.setIdle(true);
    ctx.mediaPlaying(true);
  };
  const onStop = () => {
    host.classList.remove('is-playing');
    ctx.world.setFocus(0);
    ctx.world.setIdle(false);
    ctx.mediaPlaying(false);
  };
  const onEnd = () => host.classList.add('is-ended');
  player.addEventListener('play', onPlay);
  player.addEventListener('pause', onStop);
  player.addEventListener('ended', onEnd);
  // leaving the page pauses too
  const onHide = () => document.hidden && player.pause();
  document.addEventListener('visibilitychange', onHide);

  return {
    frame,
    player,
    pause: () => player.pause(),
    dispose() {
      document.removeEventListener('visibilitychange', onHide);
      unbind();
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onStop);
      player.removeEventListener('ended', onEnd);
      player.dispose();
      ctx.world.setFocus(0);
      ctx.world.setIdle(false);
    },
  };
}
