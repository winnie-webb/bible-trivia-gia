import type { AudioManager } from '../audio/AudioManager';
import { h } from '../utils/dom';
import type { Director } from './Director';

/**
 * The only persistent UI: a sound toggle and a quiet menu.
 * The menu offers sound, motion, "previous moment", and — only for moments
 * already experienced — a way to revisit them. It never reveals what's ahead.
 */

const SOUND_ON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="currentColor"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
const SOUND_OFF =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="currentColor"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

export function mountControls(root: HTMLElement, director: Director, audio: AudioManager, motion: { get(): boolean; set(v: boolean): void }) {
  const soundBtn = h('button.ctl.ctl-sound', { type: 'button' });
  const menuBtn = h('button.ctl.ctl-menu', { type: 'button', 'aria-label': 'Menu', 'aria-expanded': 'false' }, [h('span'), h('span'), h('span')]);
  const bar = h('div.controls', {}, [soundBtn, menuBtn]);

  const renderSound = () => {
    soundBtn.innerHTML = audio.enabled ? SOUND_ON : SOUND_OFF;
    soundBtn.setAttribute('aria-label', audio.enabled ? 'Turn sound off' : 'Turn sound on');
    soundBtn.classList.toggle('is-off', !audio.enabled);
  };
  soundBtn.addEventListener('click', () => {
    if (!audio.ctx) audio.unlock(true);
    else audio.setEnabled(!audio.enabled);
  });
  audio.onChange(renderSound);
  renderSound();

  const menu = h('div.menu', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' });
  const close = () => {
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    director.setPaused(false);
  };
  const open = () => {
    renderMenu();
    menu.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    director.setPaused(true);
  };
  menuBtn.addEventListener('click', () => (menu.classList.contains('is-open') ? close() : open()));
  menu.addEventListener('click', (e) => {
    if (e.target === menu) close();
  });
  window.addEventListener('keydown', (e) => e.key === 'Escape' && close());

  function renderMenu() {
    const visited = director.beats
      .map((b, i) => ({ b, i }))
      .filter(({ b, i }) => b.navLabel && b.kind !== 'gate' && i <= director.furthest);
    menu.replaceChildren(
      h('div.menu-sheet', {}, [
        h('p.kicker', { text: 'Chapter 20' }),
        h('div.menu-row', {}, [
          h('button.menu-opt', { type: 'button', onclick: () => (audio.ctx ? audio.setEnabled(!audio.enabled) : audio.unlock(true), renderMenu()) }, [
            h('span', { text: 'Sound' }),
            h('span.menu-val', { text: audio.enabled ? 'On' : 'Off' }),
          ]),
          h('button.menu-opt', { type: 'button', onclick: () => (motion.set(!motion.get()), renderMenu()) }, [
            h('span', { text: 'Motion' }),
            h('span.menu-val', { text: motion.get() ? 'Reduced' : 'Full' }),
          ]),
        ]),
        h('button.menu-link', { type: 'button', disabled: director.index <= 1, onclick: () => (close(), director.prev()) }, [h('span', { text: '← Previous moment' })]),
        visited.length > 1
          ? h('div.menu-revisit', {}, [
              h('p.menu-label', { text: 'Revisit' }),
              h(
                'ol.menu-list',
                {},
                visited.map(({ b, i }) =>
                  h('li', {}, [
                    h('button', { type: 'button', class: i === director.index ? 'is-current' : '', onclick: () => (close(), director.jump(i)) }, [h('span', { text: b.navLabel! })]),
                  ]),
                ),
              ),
            ])
          : null,
        h('button.menu-close', { type: 'button', onclick: close }, [h('span', { text: 'Return' })]),
      ]),
    );
  }

  root.append(bar, menu);
}
