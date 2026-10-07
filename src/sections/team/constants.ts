/** Design-system entrance easing (the hero's). */
export const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

/**
 * Pendulum spring, rotation in degrees. ω = √(k/m) = √(90/1.2) ≈ 8.66 rad/s → natural
 * period ≈ 0.73 s; ζ = c / 2√(km) ≈ 0.385 → about three visible overshoots, at rest in
 * ≈ 1.8 s. A paper pass on a ~20 cm strap behaves like this. The shared SPRING is
 * over-damped (ζ 0.75) and reads as a UI snap-back, not a hanging object.
 */
export const SWING = {
  type: 'spring',
  stiffness: 90,
  damping: 8,
  mass: 1.2,
  restDelta: 0.02,
  restSpeed: 0.1,
} as const;

export const SWING_LIMIT = 45; // deg — hard clamp on the rendered rotation
export const GRAB_LIMIT = 40; // deg — clamp while the pointer holds a badge
export const RELEASE_VMAX = 400; // deg/s — cap on the velocity carried out of a grab

export const NUDGE_GAIN = 0.06; // deg/s of angular impulse per px/s of pointer speed
export const NUDGE_MAX = 120; // deg/s → peak ≈ 9°; a hard flick ≈ 14°
export const NUDGE_MIN = 8; // deg/s — below this, ignore (hand hovering still)
export const NUDGE_REACH = 1.1; // × hanger width — proximity falloff radius
export const NUDGE_COOLDOWN = 90; // ms per badge between impulses
export const RIPPLE_STAGGER = 40; // ms between badges struck in the same frame

export const KEY_IMPULSE = 90; // deg/s for ← →
export const FLICK_IMPULSE = 120; // deg/s for Space / Enter
export const HANG_IMPULSE = 45; // deg/s, first time the rail comes into view
