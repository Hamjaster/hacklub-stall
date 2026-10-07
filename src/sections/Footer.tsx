import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import HackClubLogo from '../components/HackClubLogo';
import ScrambleIn from '../components/ScrambleIn';
import FooterVideo from './footer/FooterVideo';
import Wordmark from './footer/Wordmark';
import { CONTACT, SITE_INDEX, SOCIALS, WHATSAPP_INVITE } from './footer/data';

// DS §5 motion constant (entrances). Not exported: this file exports only the component (fast refresh).
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

const BLURB =
  'The NUST chapter of Hack Club — a worldwide nonprofit network of student-run coding clubs. We build in public, break things on purpose, and ship things nobody asked for.';

// One row class for both ledgers (FOLLOW and SITE).
const ROW =
  'group flex items-baseline justify-between gap-4 border-b border-line py-3 font-mono text-[13px] text-fg-2 ' +
  'transition-colors duration-[180ms] hover:text-signal focus-visible:text-signal';
const CODE =
  'w-7 shrink-0 text-[11px] uppercase tracking-[0.14em] text-fg-3 transition-colors duration-[180ms] group-hover:text-signal/70 group-focus-visible:text-signal/70';
const ARROW = 'inline-block transition-transform duration-[180ms] ease-out';
const LINK = 'transition-colors duration-[180ms] hover:text-signal';

export default function Footer() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const h2InView = useInView(h2Ref, { once: true, amount: 0.6 });
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: '100% 0px',
      threshold: 0,
    });
    const viewIO = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0,
    });
    nearIO.observe(el);
    viewIO.observe(el);
    return () => {
      nearIO.disconnect();
      viewIO.disconnect();
    };
  }, []);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.4 },
    transition: { duration: reduce ? 0.3 : 0.7, ease: EASE_OUT, delay },
  });

  const backToTop = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer
      id="contact"
      data-surface="dark"
      aria-labelledby="contact-heading"
      ref={rootRef}
      className="section bg-ink pb-0 text-fg md:pb-0"
      style={{ touchAction: 'pan-y' }}
    >
      {/* layer 0 — the mascot, dimmed (absent under reduced motion / until near) */}
      <FooterVideo near={near} inView={inView} />
      {/* layer 1 — the hero's vignette, then a top scrim so header + ledger sit on near-ink */}
      <div className="pointer-events-none absolute inset-0 bg-vignette" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-ink via-ink/70 to-transparent" />
      {/* layer 2 — the grid */}
      <div className="grid-dots pointer-events-none absolute inset-0" />

      {/* header */}
      <div className="wrap relative z-10">
        <motion.p className="kicker" {...fade(0)}>
          07 / Contact
        </motion.p>
        <div className="mt-6 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2
            id="contact-heading"
            ref={h2Ref}
            className="font-mono text-[clamp(32px,5.5vw,64px)] font-normal leading-[1.0] tracking-[-0.03em] text-fg lg:col-span-9"
          >
            <span className="block text-balance lg:whitespace-nowrap">
              {reduce ? (
                'You scrolled this far.'
              ) : (
                <ScrambleIn text="You scrolled this far." delay={0} triggered={h2InView} />
              )}
            </span>
            <span className="block text-balance lg:whitespace-nowrap">
              {reduce ? (
                'Come build with us.'
              ) : (
                <ScrambleIn text="Come build with us." delay={250} triggered={h2InView} />
              )}
            </span>
          </h2>
          <motion.p
            className="mt-6 max-w-xl font-sans text-[17px] leading-[1.55] text-fg-2 sm:text-[19px] lg:col-span-3 lg:col-start-10 lg:mt-0"
            {...fade(0.1)}
          >
            The WhatsApp community is the front door. Join it, or write to us.
          </motion.p>
        </div>
      </div>

      {/* ledger + bottom line — one entrance group */}
      <motion.div className="wrap relative z-10 mt-16 md:mt-24" {...fade(0.15)}>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* club column: name, blurb, CTA, address */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 text-fg">
              <HackClubLogo size={22} />
              <span className="font-mono text-[15px] tracking-tight">Hack Club NUST</span>
            </div>
            <p className="mt-5 max-w-sm font-sans text-[15px] leading-[1.6] text-fg-2">{BLURB}</p>
            <a
              href={WHATSAPP_INVITE}
              target="_blank"
              rel="noreferrer"
              aria-label="Join the WhatsApp community (opens in a new tab)"
              className="btn-primary mt-8 w-full sm:w-auto"
            >
              <i className="bi bi-whatsapp text-[16px]" aria-hidden="true" />
              Join the WhatsApp community
            </a>
            <address className="mt-10 not-italic">
              <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 font-mono text-[13px] leading-[1.6]">
                <dt className="pt-px text-[12px] uppercase tracking-[0.08em] text-fg-3">Write</dt>
                <dd>
                  <a href={`mailto:${CONTACT.email}`} className={`break-all text-fg-2 ${LINK}`}>
                    {CONTACT.email}
                  </a>
                </dd>
                <dt className="pt-px text-[12px] uppercase tracking-[0.08em] text-fg-3">Where</dt>
                <dd className="text-fg-2">{CONTACT.location}</dd>
              </dl>
            </address>
          </div>

          {/* FOLLOW */}
          <nav aria-label="Social links" className="md:col-span-3 md:col-start-7">
            <div className="rule-label">Follow</div>
            <ul className="mt-5">
              {SOCIALS.map((s) => (
                <li key={s.code}>
                  <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className={ROW}>
                    <span className="flex items-baseline gap-4">
                      <span className={CODE} aria-hidden="true">
                        {s.code}
                      </span>
                      {s.handle}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`${ARROW} group-hover:-translate-y-0.5 group-hover:translate-x-0.5`}
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* SITE */}
          <nav aria-label="Site index" className="md:col-span-3 md:col-start-10">
            <div className="rule-label">Site</div>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 md:block">
              {SITE_INDEX.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className={ROW}>
                    <span className="flex items-baseline gap-4">
                      <span className={CODE} aria-hidden="true">
                        {s.index}
                      </span>
                      {s.label}
                    </span>
                    <span aria-hidden="true" className={`${ARROW} group-hover:translate-x-1`}>
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#top"
              onClick={backToTop}
              className="group mt-6 inline-flex items-baseline gap-3 font-mono text-[13px] text-fg-2 transition-colors duration-[180ms] hover:text-signal"
            >
              <span aria-hidden="true" className={`${ARROW} group-hover:-translate-y-1`}>
                ↑
              </span>
              Back to top
            </a>
          </nav>
        </div>

        <div className="rule mt-16 md:mt-20" />
        <div className="flex flex-col gap-2 py-5 font-mono text-[12px] text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Hack Club NUST. Built by students, in the open.</p>
          <a
            href={CONTACT.hq}
            target="_blank"
            rel="noreferrer"
            aria-label="hackclub.com, Hack Club HQ (opens in a new tab)"
            className={LINK}
          >
            A Hack Club chapter · hackclub.com ↗
          </a>
        </div>
      </motion.div>

      {/* the signature */}
      <Wordmark rootRef={rootRef} active={inView} className="relative z-10 mt-6 md:mt-10" />
    </footer>
  );
}
