const MS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;

/** "52 min" abaixo de uma hora, "1h 05min" a partir dela. Intervalo negativo (relógio atrás do servidor) é "0 min". */
export function formatElapsed(fromMs: number, toMs: number): string {
  const totalMinutes = Math.max(0, Math.floor((toMs - fromMs) / MS_PER_MINUTE));

  if (totalMinutes < MINUTES_PER_HOUR) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = String(totalMinutes % MINUTES_PER_HOUR).padStart(2, '0');

  return `${hours}h ${minutes}min`;
}
