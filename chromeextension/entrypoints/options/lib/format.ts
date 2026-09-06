/**
 * Formats a millisecond timestamp as `yyyy-MM-dd HH:mm:ss`, matching the
 * format the old Angular templates used (`date: 'yyyy-MM-dd HH:mm:ss'`).
 */
export function formatDateTime(timestamp?: number): string {
  if (!timestamp) {
    return '';
  }
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}
