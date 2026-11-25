const UUID_BYTE_COUNT = 16;
const VERSION_BYTE_INDEX = 6;
const VARIANT_BYTE_INDEX = 8;
const VERSION_4_MASK = 0x0f;
const VERSION_4_BITS = 0x40;
const VARIANT_MASK = 0x3f;
const VARIANT_BITS = 0x80;
const HEX_RADIX = 16;
const HEX_DIGITS_PER_BYTE = 2;
const DASH_BEFORE_BYTE_INDEXES: readonly number[] = [4, 6, 8, 10];

/**
 * UUID v4. `crypto.randomUUID` só existe em contexto seguro, e o tablet de teste abre o dev server
 * em `http://` de rede local: lá o v4 é montado com `crypto.getRandomValues`, que existe sempre.
 */
export function randomUuid(): string {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(UUID_BYTE_COUNT));

  bytes[VERSION_BYTE_INDEX] = (bytes[VERSION_BYTE_INDEX] & VERSION_4_MASK) | VERSION_4_BITS;
  bytes[VARIANT_BYTE_INDEX] = (bytes[VARIANT_BYTE_INDEX] & VARIANT_MASK) | VARIANT_BITS;

  return Array.from(bytes, (byte, index) => {
    const hex = byte.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_BYTE, '0');

    return DASH_BEFORE_BYTE_INDEXES.includes(index) ? `-${hex}` : hex;
  }).join('');
}
