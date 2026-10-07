import { useState } from 'react';
import { motion } from 'framer-motion';
import HackClubLogo from '../../components/HackClubLogo';
import type { LeaderboardEntry } from '../types';
import { loadPlayer } from '../storage';

interface GateScreenProps {
  champion: LeaderboardEntry | null;
  playerCount: number;
  busy: boolean;
  error: string | null;
  onSubmit: (name: string, email: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GateScreen({
  champion,
  playerCount,
  busy,
  error,
  onSubmit,
}: GateScreenProps) {
  const remembered = loadPlayer();
  const [name, setName] = useState(remembered?.name ?? '');
  const [email, setEmail] = useState(remembered?.email ?? '');
  const [touched, setTouched] = useState(false);

  const nameOk = name.trim().length >= 2;
  const emailOk = EMAIL_RE.test(email.trim());
  const valid = nameOk && emailOk;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid && !busy) onSubmit(name.trim(), email.trim());
  };

  // 16px on phones: iOS Safari zooms the page into any field set smaller, and stays zoomed.
  const field =
    'h-12 w-full rounded-xl border bg-white/[0.03] px-4 text-[16px] sm:text-[14px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-brand';

  return (
    <motion.div
      className="mx-auto flex w-full max-w-md flex-col px-6 py-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2.5 text-brand">
        <HackClubLogo size={22} />
        <span className="text-[12px] uppercase tracking-[0.2em]">Hack Club NUST</span>
      </div>

      <h2 className="mt-4 text-[clamp(28px,6vw,44px)] font-light leading-[1.05] tracking-[-0.03em] text-white">
        Sign in to play
      </h2>
      <p className="mt-3 text-[13px] leading-relaxed text-white/50">
        Your score goes on the club leaderboard, so we need a name to put on it.
        {playerCount > 0 && ` ${playerCount} player${playerCount === 1 ? '' : 's'} so far.`}
      </p>

      {champion && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-brand/40 bg-brand/[0.07] px-5 py-4">
          <i className="bi bi-trophy-fill text-[18px] text-brand" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.15em] text-white/40">
              Current leader
            </div>
            <div className="truncate text-[15px] text-white">
              {champion.name}
              <span className="ml-2 tabular-nums text-brand">{champion.score}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="player-name" className="mb-2 block text-[11px] uppercase tracking-[0.15em] text-white/40">
            Name
          </label>
          <input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ayesha Khan"
            maxLength={40}
            autoFocus
            autoComplete="name"
            className={`${field} ${touched && !nameOk ? 'border-brand' : 'border-white/15'}`}
          />
          {touched && !nameOk && (
            <p className="mt-1.5 text-[12px] text-brand">Give us at least two characters.</p>
          )}
        </div>

        <div>
          <label htmlFor="player-email" className="mb-2 block text-[11px] uppercase tracking-[0.15em] text-white/40">
            Email
          </label>
          <input
            id="player-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@nust.edu.pk"
            maxLength={120}
            autoComplete="email"
            className={`${field} ${touched && !emailOk ? 'border-brand' : 'border-white/15'}`}
          />
          {touched && !emailOk && (
            <p className="mt-1.5 text-[12px] text-brand">That email does not look right.</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-brand/40 bg-brand/[0.07] px-4 py-3 text-[12px] leading-relaxed text-white/70">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex h-13 min-h-[52px] items-center justify-center gap-3 rounded-full bg-brand-grad text-[15px] font-bold text-white shadow-[0_8px_30px_rgba(235,69,84,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Continue'}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-white/25">
          Stored in the club's local database. Your email is never shown on the leaderboard.
        </p>
      </form>
    </motion.div>
  );
}
