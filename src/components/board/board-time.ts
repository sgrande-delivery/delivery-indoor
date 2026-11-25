import { formatClockTime } from '@/helpers/clock-time';

const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

const FRACTION_BEYOND_MILLISECONDS = /(\.\d{3})\d+/;
const DATE_TIME_SPACE = /^(\d{4}-\d{2}-\d{2}) (\d)/;

/**
 * A api serializa com microssegundos (`2026-11-23T22:48:09.000000Z`) e o Safari do iPadOS pode recusar mais de três
 * casas fracionárias, ou o espaço no lugar do `T`: as duas formas viram o ISO de milissegundos antes do parse.
 */
function normalizeIso(iso: string): string {
  return iso.replace(FRACTION_BEYOND_MILLISECONDS, '$1').replace(DATE_TIME_SPACE, '$1T$2');
}

export function parseBoardTimestamp(iso: string | null): number | null {
  if (iso === null) {
    return null;
  }

  const timestamp = Date.parse(normalizeIso(iso));

  return Number.isNaN(timestamp) ? null : timestamp;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/** "19:48" no dia corrente (local do aparelho), "22/11 19:48" em outro dia. `null` com data inválida. */
export function formatBoardClock(iso: string | null, now: Date): string | null {
  const timestamp = parseBoardTimestamp(iso);

  if (timestamp === null) {
    return null;
  }

  const clock = formatClockTime(timestamp);

  return isSameDay(new Date(timestamp), now) ? clock : `${dayFormatter.format(timestamp)} ${clock}`;
}

/** "hoje às 20:05" ou "22/11 às 20:05". `null` com data inválida. */
export function formatBoardMoment(iso: string | null, now: Date): string | null {
  const timestamp = parseBoardTimestamp(iso);

  if (timestamp === null) {
    return null;
  }

  const clock = formatClockTime(timestamp);
  const day = isSameDay(new Date(timestamp), now) ? 'hoje' : dayFormatter.format(timestamp);

  return `${day} às ${clock}`;
}
