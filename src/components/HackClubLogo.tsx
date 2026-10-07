interface HackClubLogoProps {
  size?: number;
  className?: string;
}

/**
 * Hack Club NUST mark — the circuit-shield "HC", traced to vector from the 2K
 * master in public/brand. It is drawn as a CSS mask over currentColor, so it
 * takes the text colour like the stroked icon it replaced. Below 28px the faint
 * inner traces only muddy the letters, so small sizes use the outline-only cut.
 */
export default function HackClubLogo({ size = 18, className = '' }: HackClubLogoProps) {
  const mask = `url(${size < 28 ? '/brand/mark-sm.svg' : '/brand/mark.svg'}) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ width: size, height: size, WebkitMask: mask, mask }}
    />
  );
}
