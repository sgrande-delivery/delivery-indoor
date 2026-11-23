const clockFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

export function formatClockTime(timestamp: number): string {
  return clockFormatter.format(new Date(timestamp));
}
