/**
 * Single source for the accent colour.
 *
 * Three different accents were hardcoded across the app — #00D4AA in most
 * screens, #00d4d4 in the tab bar and splash, #6366f1 on the map and
 * notifications — so the same "accent" rendered as three colours depending on
 * which file drew it.
 *
 * NativeWind classes (`text-accent`, `bg-accent`) read the `accent` token in
 * tailwind.config.js. React Native props that take a real colour string cannot
 * use a class, so they read these constants instead. **The two must stay in
 * sync**: change `accent` in tailwind.config.js and ACCENT together.
 */
export const ACCENT = '#00D4AA';

/** Channel values for ACCENT, so overlays can vary alpha without a colour lib. */
const ACCENT_RGB = '0, 212, 170';

export function accentAlpha(alpha: number): string {
  return `rgba(${ACCENT_RGB}, ${alpha})`;
}
