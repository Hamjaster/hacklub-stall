import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { animate, motionValue, useInView, useReducedMotion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import {
  FLICK_IMPULSE,
  GRAB_LIMIT,
  HANG_IMPULSE,
  KEY_IMPULSE,
  NUDGE_COOLDOWN,
  NUDGE_GAIN,
  NUDGE_MAX,
  NUDGE_MIN,
  NUDGE_REACH,
  RELEASE_VMAX,
  RIPPLE_STAGGER,
  SWING,
} from './constants';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const toDeg = 180 / Math.PI;

type Sample = { x: number; y: number; t: number };

export type HangerBinding = {
  ref: (el: HTMLDivElement | null) => void;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (e: PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  grabbing: boolean;
  /** the badge last taken by the hand stays in front while it swings back past its neighbours */
  lifted: boolean;
};

/**
 * The staff rail's physics. Each badge is one rotation MotionValue (degrees, pivot at the
 * rail). Every input — a hand brushing past, a grab-and-release, a key —
 * becomes an angular impulse fed to framer's spring via `velocity`, so the spring is the
 * pendulum and it stops itself at rest: nothing ticks while the badges are still.
 *
 * Sign: CSS rotate(+θ) about the top moves the card's bottom LEFT, so a hand moving right
 * (vx > 0) is a negative impulse.
 */
export function useSwing(
  count: number,
  opts: { sectionRef: RefObject<HTMLElement | null>; rowRef: RefObject<HTMLDivElement | null> },
) {
  const { sectionRef, rowRef } = opts;
  const enabled = !useReducedMotion();

  const [rot] = useState<MotionValue<number>[]>(() =>
    Array.from({ length: count }, () => motionValue(0)),
  );
  const [grabbed, setGrabbed] = useState(-1);
  const [lifted, setLifted] = useState(-1);

  const hangerEls = useRef<(HTMLDivElement | null)[]>([]);
  const lastHit = useRef<number[]>(Array.from({ length: count }, () => 0));
  const grabbingIndex = useRef(-1);
  const active = useRef(false);
  const timeouts = useRef(new Set<number>());

  // brush state
  const latest = useRef<Sample | null>(null);
  const previous = useRef<Sample | null>(null);
  const vx = useRef(0);
  const rafId = useRef(0);

  // grab state
  const grab = useRef({ pivotX: 0, pivotY: 0, phi0: 0, rot0: 0, x: 0, y: 0, raf: 0 });

  // swipe state

  const flickSign = useRef(1);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timeouts.current.delete(id);
      fn();
    }, ms);
    timeouts.current.add(id);
  }, []);

  /** The impulse primitive: restart the spring from the current angle with summed velocity. */
  const kick = useCallback(
    (i: number, impulse: number) => {
      if (grabbingIndex.current === i) return; // never fight the hand
      const mv = rot[i];
      animate(mv, 0, { ...SWING, velocity: mv.getVelocity() + impulse });
    },
    [rot],
  );

  /** Untransformed slot of a hanger (its <li>), so measurements ignore the current swing. */
  const slotRect = (i: number) => {
    const el = hangerEls.current[i];
    return (el?.parentElement ?? el)?.getBoundingClientRect() ?? null;
  };

  // ---- A. pointer brush (mouse / pen), one listener on the section ----------------------
  const flush = useCallback(() => {
    rafId.current = 0;
    const p = latest.current;
    const q = previous.current;
    if (!p) return;
    if (!q || p.t - q.t > 120) {
      previous.current = p; // new stroke
      vx.current = 0;
      return;
    }
    if (p.t === q.t) return;
    const dt = Math.max(p.t - q.t, 8) / 1000;
    vx.current = 0.5 * vx.current + 0.5 * ((p.x - q.x) / dt);
    previous.current = p;

    const row = rowRef.current?.getBoundingClientRect();
    if (!row || p.y < row.top - 24 || p.y > row.bottom + 24) return; // hand is not at the rail

    const now = performance.now();
    const v = vx.current;
    const hits: { i: number; impulse: number; cx: number }[] = [];
    for (let i = 0; i < count; i++) {
      const r = slotRect(i);
      if (!r || r.right < 0 || r.left > window.innerWidth) continue;
      if (p.y < r.top - 24 || p.y > r.bottom + 24) continue; // a different row of badges
      const cx = r.left + r.width / 2;
      const w = clamp(1 - Math.abs(p.x - cx) / (r.width * NUDGE_REACH), 0, 1);
      const impulse = clamp(-v * NUDGE_GAIN, -NUDGE_MAX, NUDGE_MAX) * w;
      if (Math.abs(impulse) < NUDGE_MIN) continue;
      if (now - lastHit.current[i] < NUDGE_COOLDOWN) continue;
      hits.push({ i, impulse, cx });
    }
    hits.sort((a, b) => (v > 0 ? a.cx - b.cx : b.cx - a.cx)); // in the order the hand reaches them
    hits.forEach(({ i, impulse }, k) => {
      lastHit.current[i] = now + k * RIPPLE_STAGGER;
      if (k === 0) kick(i, impulse);
      else later(() => kick(i, impulse), k * RIPPLE_STAGGER);
    });
  }, [count, kick, later, rowRef]);

  const onSectionPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled || !active.current || e.pointerType === 'touch') return;
      latest.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      if (!rafId.current) rafId.current = requestAnimationFrame(flush);
    },
    [enabled, flush],
  );

  // ---- B. grab (mouse / pen) + C. keyboard, per hanger ----------------------------------
  const release = useCallback(
    (i: number) => {
      if (grabbingIndex.current !== i) return;
      grabbingIndex.current = -1;
      setGrabbed(-1);
      if (grab.current.raf) cancelAnimationFrame(grab.current.raf);
      grab.current.raf = 0;
      const v = clamp(rot[i].getVelocity(), -RELEASE_VMAX, RELEASE_VMAX);
      animate(rot[i], 0, { ...SWING, velocity: v });
    },
    [rot],
  );

  const bindHanger = (i: number): HangerBinding => ({
    ref: (el) => {
      hangerEls.current[i] = el;
    },
    onPointerDown: (e) => {
      if (!enabled || e.pointerType === 'touch' || e.button !== 0) return;
      e.preventDefault(); // no text selection / image drag
      e.currentTarget.setPointerCapture(e.pointerId);
      rot[i].stop(); // catch it mid-swing
      grabbingIndex.current = i;
      setGrabbed(i);
      setLifted(i);
      const r = slotRect(i);
      if (!r) return;
      const g = grab.current;
      g.pivotX = r.left + r.width / 2;
      g.pivotY = r.top;
      // anchor the grab where the hand took hold, so the badge never jumps on pointer-down
      g.phi0 = Math.atan2(e.clientX - g.pivotX, e.clientY - g.pivotY) * toDeg;
      g.rot0 = rot[i].get();
      g.x = e.clientX;
      g.y = e.clientY;
    },
    onPointerMove: (e) => {
      if (grabbingIndex.current !== i) return;
      const g = grab.current;
      g.x = e.clientX;
      g.y = e.clientY;
      if (g.raf) return;
      g.raf = requestAnimationFrame(() => {
        g.raf = 0;
        if (grabbingIndex.current !== i) return;
        const phi = Math.atan2(g.x - g.pivotX, g.y - g.pivotY) * toDeg; // + = hand right of plumb
        rot[i].set(clamp(g.rot0 - (phi - g.phi0), -GRAB_LIMIT, GRAB_LIMIT)); // .set() tracks velocity
      });
    },
    onPointerUp: () => release(i),
    onPointerCancel: () => release(i),
    onLostPointerCapture: () => release(i),
    onKeyDown: (e) => {
      if (!enabled) return;
      let impulse = 0;
      if (e.key === 'ArrowRight') impulse = -KEY_IMPULSE;
      else if (e.key === 'ArrowLeft') impulse = KEY_IMPULSE;
      else if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        impulse = flickSign.current * FLICK_IMPULSE;
        flickSign.current *= -1;
      } else return;
      e.preventDefault();
      kick(i, impulse);
    },
    grabbing: grabbed === i,
    lifted: lifted === i,
  });

  // ---- D. the first hang -----------------------------------------------------------------
  const rowInView = useInView(rowRef, { once: true, amount: 0.5 });
  useEffect(() => {
    if (!rowInView || !enabled) return;
    later(() => {
      for (let i = 0; i < count; i++) later(() => kick(i, HANG_IMPULSE), i * RIPPLE_STAGGER);
    }, 300);
  }, [rowInView, enabled, count, kick, later]);

  // ---- E. pause offscreen + cleanup --------------------------------------------------------
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      active.current = true;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        active.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          if (rafId.current) cancelAnimationFrame(rafId.current);
          rafId.current = 0;
          previous.current = null;
        }
      },
      { threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [sectionRef]);

  useEffect(() => {
    const pending = timeouts.current;
    const g = grab.current;
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (g.raf) cancelAnimationFrame(g.raf);
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
      rot.forEach((mv) => mv.stop());
    };
  }, [rot]);

  return { enabled, rot, onSectionPointerMove, bindHanger };
}
