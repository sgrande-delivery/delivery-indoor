const REFERENCE_DIGITS = 7;

const REFERENCE_FIRST_GROUP = 4;

const HEX_DIGIT_MASK = 0x0f;

export function createErrorReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(REFERENCE_DIGITS));
  const digits = Array.from(bytes, byte => (byte & HEX_DIGIT_MASK).toString(16).toUpperCase()).join('');

  return `${digits.slice(0, REFERENCE_FIRST_GROUP)}-${digits.slice(REFERENCE_FIRST_GROUP)}`;
}
