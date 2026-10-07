import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import ScrambleIn from '../components/ScrambleIn';
import { OFFICE_BEARERS } from '../team';
import Badge from './team/Badge';
import Roster from './team/Roster';
import { EASE_OUT } from './team/constants';
import { useSwing } from './team/useSwing';
import TeamModal from './team/TeamModal';

// badge indices per rail, three to a rail; from xl the rails sit side by side and read as one
const RAILS = Array.from({ length: Math.ceil(OFFICE_BEARERS.length / 3) }, (_, r) =>
  OFFICE_BEARERS.slice(r * 3, r * 3 + 3).map((_, k) => r * 3 + k),
);

/**
 * 04 — The staff rail. Six passes hang by their lanyards from steel rails; the cursor
 * brushing past swings them, a grab pulls one aside and lets it go. On a phone they are
 * laid flat as a roster instead, so all six are on screen without a sideways swipe.
 */
export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);

  const reduce = useReducedMotion();
  const h2InView = useInView(h2Ref, { once: true, amount: 0.6 });

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const watermarkY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);

  const swing = useSwing(OFFICE_BEARERS.length, { sectionRef, rowRef });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const entrance = reduce
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.3 },
      }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.7, ease: EASE_OUT },
      };

  return (
    <section
      id="team"
      data-surface="paper"
      aria-labelledby="team-heading"
      ref={sectionRef}
      onPointerMove={swing.enabled ? swing.onSectionPointerMove : undefined}
      className="section surface-paper [touch-action:pan-y]"
    >
      <div className="grid-dots pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* display watermark — the only scroll-linked element */}
      <motion.div
        aria-hidden="true"
        style={{ y: watermarkY }}
        className="pointer-events-none absolute right-[-0.03em] top-10 select-none font-display uppercase leading-[0.9] tracking-[-0.02em] text-[clamp(72px,14vw,220px)] text-pen opacity-[0.06] md:top-8"
      >
        STAFF
      </motion.div>

      <div className="wrap relative">
        {/* header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.p className="kicker-paper" {...entrance}>
              04 / The Team
            </motion.p>
            <h2
              id="team-heading"
              ref={h2Ref}
              className="mt-6 font-mono font-normal text-[clamp(32px,5.5vw,64px)] leading-[1.0] tracking-[-0.03em] text-pen"
            >
              <span className="block">
                {reduce ? 'Run by students.' : <ScrambleIn text="Run by students." delay={0} triggered={h2InView} />}
              </span>
              <span className="block">
                {reduce ? 'These six.' : <ScrambleIn text="These six." delay={250} triggered={h2InView} />}
              </span>
            </h2>
          </div>
          <motion.p
            className="max-w-xl font-sans text-[17px] leading-[1.55] text-pen-2 sm:text-[19px] md:max-w-sm md:pb-1 md:text-right"
            {...entrance}
          >
            The students who run Hack Club NUST: the events, the partners, the money, the posts,
            and this site.
          </motion.p>
        </div>

        {/* phones: the passes laid flat, all six on screen */}
        <motion.div className="mt-10 sm:hidden" {...entrance} viewport={{ once: true, amount: 0.15 }}>
          <Roster members={OFFICE_BEARERS} onOpen={setOpenIndex} />
        </motion.div>

        {/* the toy: the passes on their lanyards — two rails of three, one rail of six from xl,
            where the two rails meet at the same height and read as one */}
        <motion.div className="relative mt-16 hidden sm:block md:mt-20" {...entrance} viewport={{ once: true, amount: 0.15 }}>
          <div ref={rowRef} className="grid gap-y-6 xl:grid-cols-2 xl:gap-x-4">
            {RAILS.map((rail, r) => (
              <div key={r} className="relative">
                {/* rail: full-bleed, under the strap tops; the section clips it at the edges */}
                <div
                  aria-hidden="true"
                  className="absolute left-[calc(50%-50vw)] right-[calc(50%-50vw)] top-0 h-[3px] rounded-full bg-pen"
                />
                <ul role="list" aria-label={r === 0 ? 'Office bearers' : undefined} className="grid grid-cols-3 gap-4 pb-12">
                  {rail.map((i) => (
                    <li key={OFFICE_BEARERS[i].name} className="flex justify-center">
                      <div className="w-full max-w-[200px]">
                        <Badge
                          member={OFFICE_BEARERS[i]}
                          index={i}
                          rot={swing.rot[i]}
                          enabled={swing.enabled}
                          bind={swing.bindHanger(i)}
                          onOpen={() => setOpenIndex(i)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* caption */}
        <div className="rule-paper mt-4" />
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.2em] text-pen-3">
          <span>
            <span className="hidden sm:inline">Six badges · </span>Session 2026–27 · Tap one to open their file
          </span>
          {swing.enabled && <span className="hidden sm:inline">Grab one, let go</span>}
        </div>
      </div>

      <TeamModal
        members={OFFICE_BEARERS}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onMove={setOpenIndex}
      />
    </section>
  );
}
