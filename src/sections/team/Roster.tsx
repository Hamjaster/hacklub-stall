import type { OfficeBearer } from '../../team';

// the badge's printed barcode, shortened to a tag
const BARCODE =
  '[background-image:repeating-linear-gradient(90deg,#141114_0_1px,transparent_1px_3px,#141114_3px_5px,transparent_5px_6px,#141114_6px_7px,transparent_7px_10px,#141114_10px_11px,transparent_11px_14px)]';

interface RosterProps {
  members: OfficeBearer[];
  onOpen: (index: number) => void;
}

/**
 * The staff rail on a phone: six passes laid flat as ID strips, so the whole
 * council is on screen at once instead of behind a sideways swipe. Same card
 * stock, photo, tag and number as the badges; a tap opens the same file.
 */
export default function Roster({ members, onOpen }: RosterProps) {
  return (
    <ul role="list" aria-label="Office bearers" className="flex flex-col gap-2.5">
      {members.map((m, i) => (
        <li key={m.name}>
          <button
            type="button"
            onClick={() => onOpen(i)}
            aria-haspopup="dialog"
            aria-label={`${m.name}, ${m.role}. Open their file.`}
            className="group relative flex w-full items-center gap-3.5 rounded-[4px] border border-line-paper bg-paper-2 p-2.5 text-left shadow-[0_1px_0_rgba(20,17,20,0.06),0_10px_20px_-14px_rgba(20,17,20,0.4)] transition-colors active:bg-paper-3/60"
          >
            {/* the pass's black top bar, turned into a spine */}
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 rounded-l-[4px] bg-pen" />

            <span
              aria-hidden="true"
              className="relative ml-1 h-16 w-16 shrink-0 overflow-hidden rounded-[2px] bg-ink"
            >
              {m.photo && (
                <img
                  src={m.photo}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-[50%_18%]"
                />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-[15px] leading-[1.2] text-pen">{m.name}</span>
              <span className="tag-paper mt-1.5 transition-colors duration-[180ms] group-hover:border-signal-deep/60 group-hover:text-signal-deep group-focus-visible:border-signal-deep/60 group-focus-visible:text-signal-deep">
                {m.role}
              </span>
            </span>

            <span aria-hidden="true" className="flex shrink-0 flex-col items-end gap-1.5 pr-1">
              <span className="font-mono text-[10px] tracking-[0.12em] text-pen-2">
                NO. {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`h-2.5 w-10 opacity-70 ${BARCODE}`} />
              <span className="font-mono text-[13px] leading-none text-pen-2 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
