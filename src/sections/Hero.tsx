import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrambleIn from '../components/ScrambleIn';
import { VIDEOS } from '../videos';
import { WHATSAPP_INVITE } from '../links';
import SoundButton from '../components/SoundButton';

const SENSITIVITY = 0.8;

/* The clip is never played, so nothing ever forces the browser to decode a
   frame — and assigning `currentTime = 0` when it is already 0 is a no-op that
   fires no `seeked` and paints nothing. So the first seek is to a small
   non-zero time instead: enough to guarantee a decoded frame on the screen,
   small enough that it is visually frame zero. */
const PRIME_TIME = 0.04;

interface HeroProps {
  entranceComplete: boolean;
}

export default function Hero({ entranceComplete }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTime = useRef(0);
  const isSeeking = useRef(false);
  const lastX = useRef<number | null>(null);

  /* Hero video is never played — it is scrubbed by horizontal pointer movement.
     Seeks are chained through the `seeked` event so fast mouse travel queues one
     pending target instead of hammering currentTime and dropping frames. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      video.pause();
      // Keep the scrub origin and the primed frame identical, so the first
      // pointer movement continues from here instead of jumping.
      targetTime.current = PRIME_TIME;
      try {
        video.currentTime = PRIME_TIME;
      } catch {
        /* some browsers reject a seek before the buffer is ready; `canplay`
           below runs the same priming again once it is */
      }
    };

    /* Safety net for the browsers that refuse the seek above: by `canplay`
       there is definitely a decodable frame, so prime once more if the element
       is still sitting at zero. */
    const onCanPlay = () => {
      if (video.currentTime > 0) return;
      targetTime.current = PRIME_TIME;
      try {
        video.currentTime = PRIME_TIME;
      } catch {
        /* out of options — the poster stays up, which is the point of it */
      }
    };

    const seek = () => {
      if (isSeeking.current) return;
      if (Math.abs(video.currentTime - targetTime.current) < 0.005) return;
      isSeeking.current = true;
      video.currentTime = targetTime.current;
    };

    const onSeeked = () => {
      isSeeking.current = false;
      if (Math.abs(video.currentTime - targetTime.current) > 0.005) seek();
    };

    const scrubBy = (dx: number) => {
      const duration = video.duration;
      if (!duration || !Number.isFinite(duration)) return;
      const delta = (dx / window.innerWidth) * duration * SENSITIVITY;
      const max = Math.max(duration - 0.05, 0);
      targetTime.current = Math.min(Math.max(targetTime.current + delta, 0), max);
      seek();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (lastX.current === null) {
        lastX.current = e.clientX;
        return;
      }
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      scrubBy(dx);
    };

    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0]?.clientX;
      if (x === undefined) return;
      if (lastX.current === null) {
        lastX.current = x;
        return;
      }
      const dx = x - lastX.current;
      lastX.current = x;
      scrubBy(dx);
    };

    const onTouchEnd = () => {
      lastX.current = null;
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('seeked', onSeeked);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('seeked', onSeeked);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const headingClass =
    'text-white font-light leading-[0.95] tracking-[-0.03em] text-[clamp(40px,10vw,100px)] [@media(orientation:landscape)_and_(max-height:500px)]:text-[clamp(36px,12svh,60px)]';

  // At least a screen tall rather than exactly one: a phone held sideways is
  // ~390px high, and a fixed height clipped the CTAs off the bottom.
  return (
    <section id="top" className="relative flex w-full min-h-screen-dvh flex-col overflow-hidden">
      {/* The poster is frame zero of the same clip, 86 KB against the video's
          5.3 MB. It is what stands in for the character while those megabytes
          arrive, and what stays up if they never do — without it the hero is an
          empty black box on a slow connection or a blocked video. */}
      <video
        ref={videoRef}
        src={VIDEOS.hero}
        poster="/hero-poster.jpg"
        muted
        playsInline
        preload="auto"
        aria-label="Hack Club NUST mascot"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* brand wash + vignette so white type stays readable over any frame */}
      <div className="pointer-events-none absolute inset-0 bg-brand-grad opacity-30 mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,5,7,0.30)_0%,rgba(11,5,7,0.85)_100%)]" />

      {/* dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* watermark */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-1/2 flex justify-center opacity-[0.12]"
        style={{ transform: 'translateY(calc(-50% + 50px))' }}
      >
        <span
          className="whitespace-nowrap uppercase leading-none"
          style={{
            fontFamily: '"Anton SC", sans-serif',
            fontSize: 'clamp(90px, 23vw, 400px)',
            letterSpacing: '-4px',
            backgroundImage:
              'radial-gradient(circle, rgba(242,98,81,0) 0%, #EB4554 70%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Hack Club
        </span>
      </div>

      {/* content */}
      <motion.div
        className="relative z-10 flex flex-1 flex-col px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-24 md:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: entranceComplete ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex-1" />

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <h1 className={headingClass}>
              <ScrambleIn text="Build" delay={200} triggered={entranceComplete} />
              <br />
              <ScrambleIn text="In Public" delay={500} triggered={entranceComplete} />
            </h1>

            {/* On a phone this paragraph lands on the mascot's lit goggles, so it
                gets more opacity and a dark halo there; wider screens clear it. */}
            <motion.p
              className="max-w-md text-[13px] leading-relaxed text-white/60 max-sm:text-white/80 max-sm:[text-shadow:0_1px_12px_rgba(11,5,7,0.95)] sm:text-[15px]"
              initial={{ opacity: 0, y: 25 }}
              animate={entranceComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.215, 0.61, 0.355, 1.0], delay: 0.2 }}
            >
              The NUST chapter of Hack Club — a worldwide nonprofit network of student-run coding
              clubs. We host hackathons, workshops, and tech and cyber events, and build whatever
              the club decides to make next. No experience asked for.
            </motion.p>

            <motion.div
              className="mt-2 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={entranceComplete ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.215, 0.61, 0.355, 1.0], delay: 0.45 }}
            >
              <a
                href={WHATSAPP_INVITE}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-full bg-brand-grad px-6 text-[13.5px] font-bold text-white shadow-[0_8px_30px_rgba(235,69,84,0.32)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <i className="bi bi-whatsapp text-[15px]" aria-hidden="true" />
                Join the WhatsApp community
              </a>
              <a
                href="#club"
                className="flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-6 text-[13.5px] text-white/80 backdrop-blur-md transition-colors hover:border-white/45 hover:text-white"
              >
                What is Hack Club?
              </a>
              <SoundButton />
            </motion.div>
          </div>

          <h1 className={`${headingClass} text-left md:text-right`}>
            <ScrambleIn text="Ship" delay={700} triggered={entranceComplete} />
            <br />
            <ScrambleIn text="Anyway" delay={1000} triggered={entranceComplete} />
          </h1>
        </div>
      </motion.div>
    </section>
  );
}
