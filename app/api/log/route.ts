import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_CHARS = 2048;
const MAX_STACK_CHARS = 8192;

const FIELD_LIMITS: Record<string, number> = {
  source: MAX_FIELD_CHARS,
  code: MAX_FIELD_CHARS,
  message: MAX_FIELD_CHARS,
  stack: MAX_STACK_CHARS,
  digest: MAX_FIELD_CHARS,
  reference: MAX_FIELD_CHARS,
  url: MAX_FIELD_CHARS,
  userAgent: MAX_FIELD_CHARS,
  timestamp: MAX_FIELD_CHARS,
  filename: MAX_FIELD_CHARS,
  lineno: MAX_FIELD_CHARS,
  colno: MAX_FIELD_CHARS,
};

class PayloadTooLargeError extends Error {}

/**
 * Lê o corpo contando os bytes do stream: `content-length` sozinho não basta, porque `chunked` não o traz.
 */
async function readBodyWithLimit(request: Request): Promise<string> {
  const declared = Number(request.headers.get('content-length'));

  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    received += value.byteLength;

    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function stripQueryString(value: string): string {
  const cut = value.search(/[?#]/);

  return cut === -1 ? value : value.slice(0, cut);
}

function toEntry(payload: unknown): Record<string, string> | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return null;
  }

  const entry: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!Object.hasOwn(FIELD_LIMITS, key)) {
      return null;
    }

    if (value === null || value === undefined) {
      continue;
    }

    const text = key === 'url' ? stripQueryString(String(value)) : String(value);

    entry[key] = text.slice(0, FIELD_LIMITS[key]);
  }

  return Object.keys(entry).length > 0 ? entry : null;
}

/**
 * O stdout vai para o log drain: só `application/json` (força preflight de outra origem), corpo com teto, lista
 * fechada de campos, uma linha por evento e `url` sem query string, porque o `?session=` é a credencial da mesa.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ ok: false }, { status: 415 });
  }

  let body: string;

  try {
    body = await readBodyWithLimit(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entry = toEntry(payload);

  if (!entry) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.error('[client-error]', JSON.stringify(entry));

  return NextResponse.json({ ok: true });
}
