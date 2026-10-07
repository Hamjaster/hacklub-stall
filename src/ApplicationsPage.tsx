import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchApplications,
  setApplicationStatus,
  type ApplicationRow,
  type ApplicationStatus,
  type PortfolioId,
} from './recruitment';

const KEY_STORAGE = 'hcnust_staff_key';

const PORTFOLIO_LABEL: Record<PortfolioId, string> = {
  tech: 'Tech',
  media: 'Media',
  hr: 'HR',
  em: 'Event Mgmt',
};

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  new: 'border-white/20 text-white/55',
  shortlisted: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
  accepted: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  rejected: 'border-white/12 text-white/30',
};

const STATUSES: ApplicationStatus[] = ['new', 'shortlisted', 'accepted', 'rejected'];

const when = (ms: number) => new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * The exec team's applications inbox, at /applications. Gated by the same
 * shared staff key as the HackPass desk — one key, one team. Contact details
 * only ever reach this page, never the public API.
 */
export default function ApplicationsPage() {
  const [staffKey, setStaffKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) ?? '');
  const [entries, setEntries] = useState<ApplicationRow[] | null>(null);
  const [filter, setFilter] = useState<PortfolioId | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(
    async (key: string) => {
      if (!key) return;
      setBusy(true);
      setError(null);
      try {
        const inbox = await fetchApplications(key);
        setEntries(inbox.entries);
        try {
          sessionStorage.setItem(KEY_STORAGE, key);
        } catch {
          /* fine without persistence */
        }
      } catch (err) {
        setEntries(null);
        setError(err instanceof Error ? err.message : 'Could not load applications.');
      } finally {
        setBusy(false);
      }
    },
    []
  );

  // A key already in sessionStorage (from the HackPass desk) loads the inbox
  // straight away, so staff do not retype it moving between the two tools.
  useEffect(() => {
    // Reads storage rather than the state field, so this fires once on mount
    // and not again on every later keystroke in the key input.
    const stored = sessionStorage.getItem(KEY_STORAGE) ?? '';
    if (stored) void load(stored);
  }, [load]);

  const decide = async (id: string, status: ApplicationStatus) => {
    const previous = entries;
    setEntries((rows) => rows?.map((r) => (r.id === id ? { ...r, status } : r)) ?? rows);
    try {
      await setApplicationStatus(staffKey, id, status);
    } catch (err) {
      setEntries(previous); // put the row back rather than showing a decision that did not save
      setError(err instanceof Error ? err.message : 'Could not save that decision.');
    }
  };

  const visible = useMemo(
    () => (entries ?? []).filter((row) => !filter || row.portfolio === filter),
    [entries, filter]
  );

  const counts = useMemo(() => {
    const byPortfolio: Partial<Record<PortfolioId, number>> = {};
    for (const row of entries ?? []) byPortfolio[row.portfolio] = (byPortfolio[row.portfolio] ?? 0) + 1;
    return byPortfolio;
  }, [entries]);

  const exportCsv = () => {
    const header = ['name', 'email', 'phone', 'school', 'year', 'portfolio', 'status', 'link', 'why', 'experience', 'applied'];
    const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      header.join(','),
      ...visible.map((r) =>
        [r.name, r.email, r.phone, r.school, r.year, r.portfolio, r.status, r.link, r.why, r.experience, when(r.createdAt)]
          .map((v) => escape(String(v)))
          .join(',')
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hackclub-nust-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-ink px-5 py-12 sm:px-8" style={{ fontFamily: '"Space Mono", monospace' }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-brand">Hack Club NUST</p>
            <h1 className="mt-2 text-[28px] font-light text-white">Applications</h1>
          </div>
          <a href="/staff" className="text-[12px] text-white/35 underline-offset-4 hover:text-white hover:underline">
            HackPass desk →
          </a>
        </div>

        {/* ------------------------------- key ------------------------------- */}
        <div className="mt-8 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="staff-key" className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-white/40">
              Staff key
            </label>
            <input
              id="staff-key"
              type="password"
              value={staffKey}
              onChange={(e) => setStaffKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void load(staffKey)}
              placeholder="shared key"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 text-[16px] text-white outline-none focus:border-brand sm:text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={() => void load(staffKey)}
            disabled={busy || !staffKey}
            className="h-11 rounded-full bg-brand-grad px-6 text-[13px] font-bold text-white disabled:opacity-40"
          >
            {busy ? 'Loading…' : 'Load'}
          </button>
          {entries && entries.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="h-11 rounded-full border border-white/15 px-5 text-[13px] text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              Export CSV
            </button>
          )}
        </div>

        {error && (
          <p className="mt-5 rounded-xl border border-brand/40 bg-brand/[0.07] px-4 py-3 text-[12.5px] text-white/75">
            {error}
          </p>
        )}

        {/* ----------------------------- filters ----------------------------- */}
        {entries && (
          <div className="mt-8 flex flex-wrap gap-2">
            {([''] as (PortfolioId | '')[])
              .concat(['tech', 'media', 'hr', 'em'])
              .map((id) => (
                <button
                  key={id || 'all'}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-full border px-4 py-1.5 text-[12px] transition-colors ${
                    filter === id
                      ? 'border-brand/60 bg-brand/10 text-brand'
                      : 'border-white/12 text-white/40 hover:border-white/30 hover:text-white/70'
                  }`}
                >
                  {id ? PORTFOLIO_LABEL[id] : 'All'}{' '}
                  <span className="text-white/25">
                    {id ? (counts[id] ?? 0) : entries.length}
                  </span>
                </button>
              ))}
          </div>
        )}

        {/* ------------------------------ rows ------------------------------- */}
        {entries && visible.length === 0 && (
          <p className="mt-12 text-center text-[13px] text-white/30">Nothing here yet.</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {visible.map((row) => {
            const open = expanded === row.id;
            return (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : row.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left"
                >
                  <span className="text-[15px] text-white">{row.name}</span>
                  <span className="rounded-md border border-white/12 px-2 py-0.5 text-[11px] text-white/40">
                    {PORTFOLIO_LABEL[row.portfolio]}
                  </span>
                  <span className="text-[12px] text-white/30">
                    {row.school} · {row.year} year
                  </span>
                  <div className="flex-1" />
                  <span
                    className={`rounded-full border px-3 py-0.5 text-[11px] uppercase tracking-[0.12em] ${STATUS_STYLE[row.status]}`}
                  >
                    {row.status}
                  </span>
                  <i
                    className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'} text-[13px] text-white/25`}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div className="border-t border-white/8 px-5 py-5">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] text-white/45">
                      <a href={`mailto:${row.email}`} className="hover:text-brand">
                        {row.email}
                      </a>
                      {row.phone && <span>{row.phone}</span>}
                      {row.link && (
                        <a href={row.link} target="_blank" rel="noreferrer" className="hover:text-brand">
                          {row.link}
                        </a>
                      )}
                      <span className="text-white/25">applied {when(row.createdAt)}</span>
                    </div>

                    <p className="mt-4 text-[11px] uppercase tracking-[0.15em] text-white/30">Why</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/70">
                      {row.why}
                    </p>

                    {row.experience && (
                      <>
                        <p className="mt-4 text-[11px] uppercase tracking-[0.15em] text-white/30">Experience</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/70">
                          {row.experience}
                        </p>
                      </>
                    )}

                    <div className="mt-6 flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => void decide(row.id, status)}
                          disabled={row.status === status}
                          className={`rounded-full border px-4 py-1.5 text-[12px] transition-colors disabled:opacity-100 ${
                            row.status === status
                              ? STATUS_STYLE[status]
                              : 'border-white/12 text-white/40 hover:border-white/35 hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
