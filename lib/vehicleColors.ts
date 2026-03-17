/** Map of color names (from API) to hex values. */
const COLOR_TO_HEX: Record<string, string> = {
  White: '#ffffff',
  Gray: '#6b7280',
  Black: '#1f2937',
  Silver: '#9ca3af',
  Blue: '#3b82f6',
  Red: '#ef4444',
  Green: '#22c55e',
  Brown: '#92400e',
  Beige: '#d4b896',
  Gold: '#f59e0b',
  Orange: '#f97316',
  Yellow: '#eab308',
  Purple: '#a855f7',
  Pink: '#ec4899',
};

/** Default gray when color is unknown. */
const DEFAULT_COLOR = '#6b7280';

/** Returns hex for a color name; falls back to default gray if unknown. */
export function getVehicleColorHex(colorName: string | undefined): string {
  if (!colorName) return DEFAULT_COLOR;
  const hex = COLOR_TO_HEX[colorName];
  if (hex) return hex;
  // If it's already a hex (e.g. #ff0000), use it
  if (colorName.startsWith('#')) return colorName;
  return DEFAULT_COLOR;
}
