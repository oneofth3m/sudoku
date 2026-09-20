/**
 * Formats seconds as MM:SS, switching to HH:MM:SS once an hour has passed.
 * A leading "00:" hour field would read like seconds/milliseconds, so below
 * one hour it is omitted entirely (e.g. 7s → "00:07", 7m23 → "07:23").
 */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mmss = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return hh > 0 ? `${String(hh).padStart(2, '0')}:${mmss}` : mmss;
}