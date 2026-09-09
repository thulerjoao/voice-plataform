const ATTR = "data-sb";

function isScrollable(el: HTMLElement) {
  const style = getComputedStyle(el);
  return (
    /(auto|scroll)/.test(style.overflowY) ||
    /(auto|scroll)/.test(style.overflowX) ||
    /(auto|scroll)/.test(style.overflow)
  );
}

function scrollableFrom(target: EventTarget | null) {
  let node: Element | null = target instanceof Element ? target : null;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && isScrollable(node)) return node;
    node = node.parentElement;
  }
  return null;
}

/** Reveal scrollbars via data-sb; clears stuck Chromium thumb styles after drag. */
export function bindScrollbarAutoHide() {
  let dragging: HTMLElement | null = null;
  const watched = new WeakSet<HTMLElement>();

  const onLeave = (event: PointerEvent) => {
    const el = event.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    if (dragging === el && event.buttons !== 0) return;
    el.removeAttribute(ATTR);
  };

  const reveal = (el: HTMLElement) => {
    el.setAttribute(ATTR, "1");
    if (watched.has(el)) return;
    watched.add(el);
    el.addEventListener("pointerleave", onLeave);
  };

  document.addEventListener("pointerover", (event) => {
    const el = scrollableFrom(event.target);
    if (el) reveal(el);
  });

  document.addEventListener("pointerdown", (event) => {
    const el = scrollableFrom(event.target);
    if (!el) return;
    dragging = el;
    reveal(el);
  });

  const onUp = () => {
    dragging = null;
    for (const el of document.querySelectorAll<HTMLElement>(`[${ATTR}]`)) {
      if (!el.matches(":hover")) el.removeAttribute(ATTR);
    }
  };

  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}
