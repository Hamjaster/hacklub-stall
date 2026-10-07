import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { OfficeBearer } from '../../team';
import { ROLE_COPY } from './roles';

const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

interface TeamModalProps {
  members: OfficeBearer[];
  /** Index of the open badge, or null when closed. */
  index: number | null;
  onClose: () => void;
  onMove: (index: number) => void;
}

/**
 * A staff file: the portrait on the left, the role in plain words on the
 * right, and previous/next to walk the council without closing. Escape and the
 * backdrop close it, ←/→ move between people, focus starts on Close and goes
 * back to the badge that opened it.
 */
export default function TeamModal({ members, index, onClose, onMove }: TeamModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  // whoever was showing last gets focus back on close (the swing stops a mouse
  // press from focusing the badge, so document.activeElement can't be trusted)
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (index !== null) last.current = index;
  }, [index]);
  const still = useReducedMotion();
  const open = index !== null;
  const n = members.length;

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.documentElement.style.overflow = previous;
      const who = last.current !== null ? members[last.current]?.name : null;
      // phones show the roster and tablets up show the badges; the other copy is display:none
      if (who)
        [...document.querySelectorAll<HTMLElement>(`#team [aria-label^="${who},"]`)]
          .find((el) => el.getClientRects().length > 0)
          ?.focus({ preventScroll: true });
    };
  }, [open, members]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onMove((index + 1) % n);
      else if (e.key === 'ArrowLeft') onMove((index - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, n, onClose, onMove]);

  const member = index !== null ? members[index] : null;
  const copy = member ? ROLE_COPY[member.role] : null;
  const first = member?.name.split(' ')[0];
  const prev = index !== null ? members[(index - 1 + n) % n] : null;
  const next = index !== null ? members[(index + 1) % n] : null;

  return (
    <AnimatePresence>
      {member && copy && index !== null && (
        <motion.div
          className="fixed inset-0 z-[110] overflow-y-auto bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-modal-name"
              className="relative w-full max-w-[920px] overflow-hidden rounded-[6px] border border-line bg-ink text-fg shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
              initial={still ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* red light from behind the portrait */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 top-0 h-full w-2/3 bg-[radial-gradient(ellipse_at_30%_40%,rgba(237,74,82,0.18),transparent_65%)]"
              />

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-ink/70 text-fg-2 backdrop-blur-md transition-colors hover:border-white/45 hover:text-fg"
              >
                <i className="bi bi-x-lg text-[14px]" aria-hidden="true" />
              </button>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={member.name}
                  className="relative grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
                  initial={still ? { opacity: 0 } : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={still ? { opacity: 0 } : { opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                >
                  {/* portrait */}
                  <div className="relative aspect-square bg-[#070304] md:aspect-auto md:min-h-full">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={`Portrait of ${member.name}`}
                        className="absolute inset-0 h-full w-full object-cover object-[50%_25%]"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-display text-[120px] text-fg/90">
                        {initials(member.name)}
                      </span>
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-1/4 md:bg-gradient-to-l"
                    />
                    <span className="absolute left-4 top-4 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2">
                      No. {String(index + 1).padStart(2, '0')} · 2026–27
                    </span>
                  </div>

                  {/* the file */}
                  <div className="relative flex flex-col p-6 pt-5 sm:p-9 md:pr-14">
                    <p className="kicker">{member.role}</p>
                    <h2
                      id="team-modal-name"
                      className="mt-4 font-display text-[clamp(44px,6vw,72px)] uppercase leading-[0.9] tracking-[-0.01em]"
                    >
                      {member.name}
                    </h2>
                    <p className="mt-5 border-l-2 border-brand pl-4 font-mono text-[14px] leading-[1.55] text-fg">
                      {copy.line}
                    </p>

                    <div className="mt-6 space-y-4 font-sans text-[15.5px] leading-[1.65] text-fg-2">
                      {copy.job.map((para) => (
                        <p key={para.slice(0, 24)}>{para}</p>
                      ))}
                    </div>

                    <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-3">
                      Come to {first} for
                    </p>
                    <ul className="mt-3 space-y-2">
                      {copy.askFor.map((item) => (
                        <li key={item} className="flex gap-3 font-sans text-[15px] leading-[1.5] text-fg">
                          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* walk the council */}
                    <div className="mt-9 flex items-center justify-between gap-3 border-t border-line pt-5">
                      <button
                        type="button"
                        onClick={() => onMove((index - 1 + n) % n)}
                        className="group/nav flex min-w-0 items-center gap-2 text-left font-mono text-[12px] uppercase tracking-[0.12em] text-fg-3 transition-colors hover:text-fg"
                      >
                        <i className="bi bi-arrow-left text-[13px]" aria-hidden="true" />
                        <span className="truncate">{prev?.name}</span>
                      </button>
                      <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-fg-3">
                        {index + 1} / {n}
                      </span>
                      <button
                        type="button"
                        onClick={() => onMove((index + 1) % n)}
                        className="flex min-w-0 items-center gap-2 text-right font-mono text-[12px] uppercase tracking-[0.12em] text-fg-3 transition-colors hover:text-fg"
                      >
                        <span className="truncate">{next?.name}</span>
                        <i className="bi bi-arrow-right text-[13px]" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
