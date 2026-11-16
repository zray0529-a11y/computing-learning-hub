/* Motion upgrade adapted to the reader's routes, accessible controls and offline build. */
const clhTransitions = new WeakMap();
const clhMotionInstances = new WeakMap();

export function withViewTransition(update, { animate = true, document: doc = globalThis.document } = {}) {
  const previous = clhTransitions.get(doc);
  if (previous) {
    // A new interaction must not leave an older, delayed DOM callback behind it.
    previous.run();
    previous.transition?.skipTransition();
    clhTransitions.delete(doc);
  }
  let called = false, result;
  const run = () => {
    if (!called) { called = true; result = update(); }
    return result;
  };
  const reduced = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reduced || !doc.startViewTransition || doc.hidden) return run();
  const pending = { run, transition: null };
  clhTransitions.set(doc, pending);
  try {
    pending.transition = doc.startViewTransition(run);
  } catch (error) {
    clhTransitions.delete(doc);
    if (called) throw error;
    return run();
  }
  pending.transition.ready?.catch(() => {});
  pending.transition.finished?.catch(() => {}).finally(() => {
    if (clhTransitions.get(doc) === pending) clhTransitions.delete(doc);
  });
  return pending.transition;
}

export function initMotionUpgrades(doc = document) {
  if (clhMotionInstances.has(doc)) return clhMotionInstances.get(doc);
  const win = doc.defaultView;
  const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const finePointer = win.matchMedia?.('(hover: hover) and (pointer: fine)');
  const cards = '.visual-course-card, .atlas-lane, .atlas-home-entry, .mini-lab';
  const revealSelector = '.visual-course-card, .atlas-lane, .atlas-home-entry';
  const bar = doc.createElement('div');
  bar.className = 'clh-scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  doc.body.prepend(bar);
  let frame = 0, disposed = false;
  const progress = () => {
    frame = 0;
    if (disposed) return;
    const height = doc.documentElement.scrollHeight - win.innerHeight;
    const fraction = height > 0 ? Math.min(1, Math.max(0, win.scrollY / height)) : 0;
    bar.style.transform = `scaleX(${fraction})`;
  };
  // Event-driven updates also work with reduced motion and without scroll timelines.
  const scheduleProgress = () => { if (!frame && !disposed) frame = win.requestAnimationFrame(progress); };
  const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting && entry.target.isConnected) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 }) : null;
  const refresh = () => {
    observer?.disconnect();
    doc.querySelectorAll(revealSelector).forEach(element => {
      const visible = reduced?.matches || !observer || element.getBoundingClientRect().top < win.innerHeight;
      element.classList.add('clh-reveal');
      element.classList.toggle('is-visible', Boolean(visible));
      if (!visible) observer.observe(element);
    });
    scheduleProgress();
  };
  const onPointerMove = event => {
    if (reduced?.matches || finePointer?.matches === false) return;
    const card = event.target.closest?.(cards);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };
  const onFocus = event => {
    const card = event.target.closest?.('.clh-reveal');
    if (card) { card.classList.add('is-visible'); observer?.unobserve(card); }
  };
  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(scheduleProgress) : null;
  resizeObserver?.observe(doc.body);
  win.addEventListener('scroll', scheduleProgress, { passive: true });
  win.addEventListener('resize', scheduleProgress, { passive: true });
  win.addEventListener('clh:route-rendered', refresh);
  doc.addEventListener('pointermove', onPointerMove, { passive: true });
  doc.addEventListener('focusin', onFocus);
  reduced?.addEventListener?.('change', refresh);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame) win.cancelAnimationFrame(frame);
    observer?.disconnect(); resizeObserver?.disconnect();
    win.removeEventListener('scroll', scheduleProgress);
    win.removeEventListener('resize', scheduleProgress);
    win.removeEventListener('clh:route-rendered', refresh);
    doc.removeEventListener('pointermove', onPointerMove);
    doc.removeEventListener('focusin', onFocus);
    reduced?.removeEventListener?.('change', refresh);
    doc.querySelectorAll('.clh-reveal').forEach(element => element.classList.remove('clh-reveal', 'is-visible'));
    bar.remove(); clhMotionInstances.delete(doc);
  };
  clhMotionInstances.set(doc, dispose);
  refresh();
  return dispose;
}
