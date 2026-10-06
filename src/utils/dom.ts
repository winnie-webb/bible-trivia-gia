/** Tiny element helper: h('div.class.other', { attr }, children) */
export function h<T extends HTMLElement = HTMLElement>(
  sel: string,
  attrs: Record<string, any> = {},
  children: (Node | string | null | undefined | false)[] = [],
): T {
  const [tag, ...classes] = sel.split('.');
  const el = document.createElement(tag || 'div') as unknown as T;
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, String(sv));
        else (el.style as any)[sk] = sv;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c != null && c !== false) el.append(c);
  return el;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Wrap each word in a span with --i so CSS can stagger the reveal. */
export function words(text: string, className = 'w'): HTMLElement {
  const frag = h('span.words');
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) frag.append(part);
    else if (part) frag.append(h(`span.${className}`, { text: part }));
  });
  frag.querySelectorAll<HTMLElement>(`.${className}`).forEach((w, i) => w.style.setProperty('--i', String(i)));
  return frag;
}

/** Wrap each character, for typography that dissolves into motes. */
export function chars(text: string): HTMLElement {
  const wrap = h('span.chars', { 'aria-label': text });
  let i = 0;
  for (const word of text.split(' ')) {
    const w = h('span.cw', { 'aria-hidden': 'true' });
    for (const c of word) {
      const s = h('span.c', { text: c });
      s.style.setProperty('--i', String(i++));
      s.style.setProperty('--r', (Math.random() * 2 - 1).toFixed(3));
      s.style.setProperty('--r2', Math.random().toFixed(3));
      w.append(s);
    }
    wrap.append(w, ' ');
  }
  return wrap;
}

/** append() that skips null/false — lets scenes write `cond ? node : null`. */
export function put(el: Element, ...children: (Node | string | null | undefined | false)[]) {
  for (const c of children) if (c != null && c !== false) el.append(c);
}
