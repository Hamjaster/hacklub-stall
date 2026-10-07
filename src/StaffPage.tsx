import { useState } from 'react';
import { lookupHackpass, redeemHackpass, type HackpassLookup } from './game/api';

const KEY_STORAGE = 'hcnust_staff_key';

function normaliseCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return cleaned.startsWith('HACK-') || cleaned === '' ? cleaned : `HACK-${cleaned}`;
}

/**
 * Internal tool for staff to check and redeem a HackPass at the counter.
 * Reached at /staff — a plain pathname check in App.tsx, not a router: this is
 * a one-page internal tool, not a second app.
 */
export default function StaffPage() {
  const [staffKey, setStaffKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) ?? '');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<HackpassLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rememberKey = (value: string) => {
    setStaffKey(value);
    try {
      sessionStorage.setItem(KEY_STORAGE, value);
    } catch {
      /* fine without persistence */
    }
  };

  const lookup = async () => {
    const clean = normaliseCode(code);
    if (!clean) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await lookupHackpass(clean));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    const clean = normaliseCode(code);
    if (!clean || !staffKey) return;
    setBusy(true);
    setError(null);
    try {
      await redeemHackpass(clean, staffKey);
      setResult(await lookupHackpass(clean));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redemption failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-[100dvh] w-full items-center justify-center bg-ink px-6 py-16"
      style={{ fontFamily: '"Space Mono", monospace' }}
    >
      <div className="w-full max-w-sm">
        <p className="text-[12px] uppercase tracking-[0.2em] text-brand">Hack Club NUST</p>
        <h1 className="mt-2 text-[28px] font-light text-white">HackPass desk</h1>
        <p className="mt-2 text-[13px] text-white/40">
          Check a code, confirm it with the player, then redeem it once.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="staff-key" className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-white/40">
              Staff key
            </label>
            <input
              id="staff-key"
              type="password"
              value={staffKey}
              onChange={(e) => rememberKey(e.target.value)}
              placeholder="shared key"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 text-[16px] text-white outline-none focus:border-brand sm:text-[14px]"
            />
          </div>

          <div>
            <label htmlFor="hackpass-code" className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-white/40">
              Code
            </label>
            <input
              id="hackpass-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void lookup()}
              placeholder="HACK-XXXXXX"
              autoFocus
              className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 text-center text-[16px] tracking-[0.2em] text-white outline-none focus:border-brand"
            />
          </div>

          <button
            type="button"
            onClick={() => void lookup()}
            disabled={busy || !code.trim()}
            className="flex h-12 items-center justify-center rounded-full border border-white/15 text-[14px] text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            Look up
          </button>

          {error && (
            <p className="rounded-lg border border-brand/40 bg-brand/[0.07] px-4 py-3 text-[12px] text-white/70">
              {error}
            </p>
          )}

          {result && (
            <div
              className={`rounded-xl border p-4 ${
                !result.valid
                  ? 'border-brand/40 bg-brand/[0.06]'
                  : result.redeemed
                    ? 'border-white/15'
                    : 'border-emerald-400/40 bg-emerald-400/[0.06]'
              }`}
            >
              {!result.valid ? (
                <p className="text-[14px] text-brand">Not a real code.</p>
              ) : (
                <>
                  <p className={`text-[14px] font-bold ${result.redeemed ? 'text-white/50' : 'text-emerald-400'}`}>
                    {result.redeemed ? 'Already redeemed' : 'Valid — not yet redeemed'}
                  </p>
                  <p className="mt-1 text-[12px] text-white/40">
                    Issued {result.issuedAt ? new Date(result.issuedAt).toLocaleString() : '—'}
                    {result.redeemed && result.redeemedAt && (
                      <> · redeemed {new Date(result.redeemedAt).toLocaleString()}</>
                    )}
                  </p>
                </>
              )}
            </div>
          )}

          {result?.valid && !result.redeemed && (
            <button
              type="button"
              onClick={() => void redeem()}
              disabled={busy || !staffKey}
              className="flex h-12 items-center justify-center rounded-full bg-brand-grad text-[14px] font-bold text-white disabled:opacity-40"
            >
              Mark redeemed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
