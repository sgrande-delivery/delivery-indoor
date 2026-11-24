export const dynamic = 'force-dynamic';

const NO_CONTENT_HEADERS = { 'Cache-Control': 'no-store' };

export function HEAD(): Response {
  return new Response(null, { status: 204, headers: NO_CONTENT_HEADERS });
}

export function GET(): Response {
  return new Response(null, { status: 204, headers: NO_CONTENT_HEADERS });
}
