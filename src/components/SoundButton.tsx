import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { soundtrack } from '../audio/soundtrack';

const BARS = 4;
/** Which analyser bins drive each bar — bass on the left, air on the right. */
const BINS = [1, 3, 6, 11];
const RESTING = [0.35, 0.6, 0.45, 0.25];

function useSoundtrackPlaying() {
  return useSyncExternalStore(soundtrack.subscribe, soundtrack.isPlaying, () => false);
}

/**
 * Four level bars that read the soundtrack's own analyser while it plays,
 * and sit still at a resting shape while it does not.
 */
function LevelBars({ playing, size }: { playing: boolean; size: 'lg' | 'sm' }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const still = useReducedMotion();

  useEffect(() => {
    const set = (i: number, v: number) => {
      const el = bars.current[i];
      if (el) el.style.transform = `scaleY(${Math.max(0.18, Math.min(v, 1))})`;
    };
    if (!playing || still) {
      RESTING.forEach((v, i) => set(i, playing ? 0.7 : v));
      return;
    }
    const data = new Uint8Array(32);
    let frame = requestAnimationFrame(function loop() {
      soundtrack.levels(data);
      BINS.forEach((bin, i) => set(i, data[bin] / 200));
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, still]);

  const h = size === 'lg' ? 'h-[15px]' : 'h-[12px]';
  return (
    <span aria-hidden="true" className={`flex ${h} items-end gap-[3px]`}>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          className="block h-full w-[3px] origin-bottom rounded-full bg-current transition-transform duration-75"
          style={{ transform: `scaleY(${RESTING[i]})` }}
        />
      ))}
    </span>
  );
}

/** The hero's sound toggle: a ghost pill that sits beside the two CTAs. */
export default function SoundButton({ className = '' }: { className?: string }) {
  const playing = useSoundtrackPlaying();

  return (
    <button
      type="button"
      onClick={soundtrack.toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Pause the club soundtrack' : 'Play the club soundtrack'}
      className={`group flex h-12 items-center gap-3 rounded-full border px-5 text-[13.5px] backdrop-blur-md transition-colors ${className} ${
        playing
          ? 'border-signal/50 bg-signal/[0.08] text-signal'
          : 'border-white/20 bg-white/[0.04] text-white/80 hover:border-white/45 hover:text-white'
      }`}
    >
      <LevelBars playing={playing} size="lg" />
      <span className="relative">
        {/* the longer label holds the width so the pill never jumps */}
        <span className="invisible">Sound off</span>
        <span className="absolute inset-0">{playing ? 'Sound off' : 'Sound on'}</span>
      </span>
    </button>
  );
}

/**
 * Once the hero has scrolled away, a playing soundtrack needs an off switch
 * that is still on screen. This small dock appears bottom-right only then.
 */
export function SoundDock() {
  const playing = useSoundtrackPlaying();
  const heroVisible = useHeroVisible();
  const show = playing && !heroVisible;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={soundtrack.pause}
          aria-label="Pause the club soundtrack"
          className="fixed bottom-5 right-5 z-40 flex h-11 items-center gap-2.5 rounded-full border border-signal/40 bg-ink/80 px-4 font-mono text-[12px] uppercase tracking-[0.14em] text-signal shadow-glow-signal backdrop-blur-md transition-colors hover:border-signal sm:bottom-6 sm:right-6"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        >
          <LevelBars playing size="sm" />
          Sound off
        </motion.button>
      )}
    </AnimatePresence>
  );
}

let heroVisible = true;

function subscribeHero(notify: () => void) {
  const hero = document.getElementById('top');
  if (!hero) return () => {};
  const io = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    notify();
  });
  io.observe(hero);
  return () => io.disconnect();
}

function useHeroVisible() {
  return useSyncExternalStore(subscribeHero, () => heroVisible, () => true);
}
