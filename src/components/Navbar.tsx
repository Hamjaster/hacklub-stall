import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HackClubLogo from './HackClubLogo';
import ScrambleText from './ScrambleText';
import SquashHamburger from './SquashHamburger';
import { WHATSAPP_INVITE } from '../links';

const pillSpring = { type: 'spring' as const, stiffness: 350, damping: 28 };

interface NavbarProps {
  entranceComplete: boolean;
  /** True while the announcement bar is up, so the pills sit below it. */
  offset?: boolean;
}

export default function Navbar({ entranceComplete, offset = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { ref: navRef, value: navSurface } = useSurfaceUnderNav();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const links = [
    { index: '01', label: 'Club', target: '#club' },
    { index: '02', label: 'Events', target: '#events' },
    { index: '03', label: 'Record', target: '#record', desktopOnly: true },
    { index: '04', label: 'Team', target: '#team' },
    { index: '05', label: 'Games', target: '#games' },
    { index: '06', label: 'Social', target: '#social', desktopOnly: true },
    { index: '07', label: 'Contact', target: '#contact' }, // the footer carries the socials
  ];

  return (
    <motion.nav
      ref={navRef}
      data-nav={navSurface}
      className={`group fixed left-0 right-0 z-50 h-20 w-full bg-transparent text-white transition-colors duration-300 data-[nav=paper]:text-pen ${offset ? 'top-14 md:top-16' : 'top-0'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: entranceComplete ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* ---------------- desktop ---------------- */}
      <div className="hidden sm:flex h-20 items-center px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-2">
          {/* logo pill */}
          <motion.a
            href="#top"
            className={`${menuOpen ? 'hidden md:flex' : 'flex'} h-12 items-center gap-2.5 rounded-[14px] bg-white/15 px-5 backdrop-blur-md transition-colors hover:bg-white/[0.22] group-data-[nav=paper]:bg-pen/[0.08] group-data-[nav=paper]:hover:bg-pen/[0.14]`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <HackClubLogo size={22} />
            <span className="text-[16px] font-medium tracking-tight">Hack Club NUST</span>
          </motion.a>

          {/* expanding menu pill */}
          <motion.div
            className="flex h-12 items-center overflow-hidden rounded-[14px] bg-white/15 backdrop-blur-md transition-colors group-data-[nav=paper]:bg-pen/[0.08]"
            animate={{ width: menuOpen ? 790 : 48 }}
            transition={pillSpring}
          >
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex shrink-0 items-center justify-center transition-colors ${
                menuOpen
                  ? 'ml-1.5 h-9 w-9 rounded-[11px] bg-white/10 hover:bg-white/20 group-data-[nav=paper]:bg-pen/[0.08] group-data-[nav=paper]:hover:bg-pen/[0.16]'
                  : 'h-12 w-12 rounded-[14px]'
              }`}
            >
              <SquashHamburger isOpen={menuOpen} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="flex items-center gap-6 pl-5"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25 }}
                >
                  {links.map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => scrollTo(link.target)}
                      onMouseEnter={() => setHovered(link.label)}
                      onMouseLeave={() => setHovered(null)}
                      className="flex items-baseline gap-1.5 whitespace-nowrap text-[16px] font-normal opacity-85 transition-opacity hover:opacity-100"
                    >
                      <span className="font-mono text-[11px] opacity-55">{link.index}</span>
                      <ScrambleText text={link.label} isHovered={hovered === link.label} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="flex-1" />

        {/* Joining the community is the page's one real call to action, so it gets the pill. */}
        <motion.a
          href={WHATSAPP_INVITE}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center gap-2 rounded-[14px] bg-brand-grad px-5 text-[15px] font-bold text-white shadow-[0_6px_24px_rgba(235,69,84,0.32)]"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <i className="bi bi-whatsapp text-[15px]" aria-hidden="true" />
          Join
        </motion.a>
      </div>

      {/* ---------------- mobile ---------------- */}
      <div className="flex sm:hidden h-20 items-center gap-2 px-4">
        <motion.a
          href="#top"
          className="flex h-9 items-center gap-2 overflow-hidden rounded-[10px] bg-white/15 px-3 backdrop-blur-md transition-colors group-data-[nav=paper]:bg-pen/[0.08]"
          animate={{ width: menuOpen ? 0 : 'auto', opacity: menuOpen ? 0 : 1 }}
          transition={pillSpring}
        >
          <HackClubLogo size={18} className="shrink-0" />
          <span className="whitespace-nowrap text-[13px] font-medium tracking-tight">
            Hack Club NUST
          </span>
        </motion.a>

        <motion.div
          className="flex h-9 items-center overflow-hidden rounded-[10px] bg-white/15 backdrop-blur-md transition-colors group-data-[nav=paper]:bg-pen/[0.08]"
          animate={{ width: menuOpen ? '100%' : 36 }}
          transition={pillSpring}
        >
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex shrink-0 items-center justify-center ${
              menuOpen ? 'ml-1 h-7 w-7 rounded-[8px] bg-white/10 group-data-[nav=paper]:bg-pen/[0.08]' : 'h-9 w-9 rounded-[10px]'
            }`}
          >
            <SquashHamburger isOpen={menuOpen} isMobile />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="flex items-center gap-4 pl-4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                {links.filter((link) => !link.desktopOnly).map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => scrollTo(link.target)}
                    className="whitespace-nowrap text-[13px] opacity-85"
                  >
                    {link.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* collapses away while the menu is expanded, like the logo pill */}
        <motion.a
          href={WHATSAPP_INVITE}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 shrink-0 items-center gap-1.5 overflow-hidden rounded-[10px] bg-brand-grad px-3 text-[13px] font-bold text-white"
          animate={{ width: menuOpen ? 0 : 'auto', opacity: menuOpen ? 0 : 1, paddingLeft: menuOpen ? 0 : 12, paddingRight: menuOpen ? 0 : 12 }}
          transition={pillSpring}
        >
          <span className="whitespace-nowrap">Join</span>
        </motion.a>
      </div>
    </motion.nav>
  );
}

/**
 * Which surface the navbar is floating over, so the glass pills can flip to
 * dark-on-paper over the light sections. Sections opt in with
 * `data-surface="paper" | "dark"`; anything unmarked (the hero) counts as dark.
 * A rAF-throttled scroll probe at the pills' midline — seven sections, so a
 * rect check per frame is cheaper than an observer per breakpoint.
 */
function useSurfaceUnderNav() {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState<'dark' | 'paper'>('dark');

  useEffect(() => {
    let frame = 0;
    const probe = () => {
      frame = 0;
      const nav = ref.current;
      if (!nav) return;
      const y = nav.getBoundingClientRect().top + 40;
      let next: 'dark' | 'paper' = 'dark';
      for (const el of document.querySelectorAll<HTMLElement>('section[data-surface]')) {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          next = el.dataset.surface === 'paper' ? 'paper' : 'dark';
          break;
        }
      }
      setValue(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(probe);
    };
    probe();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return { ref, value };
}
