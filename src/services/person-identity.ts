export const PERSON_NAME_MAX_LENGTH = 60;

const STORAGE_PREFIX = 'indoor:person:';

function storageKey(movementId: string): string {
  return `${STORAGE_PREFIX}${movementId}`;
}

export function normalizePersonName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, PERSON_NAME_MAX_LENGTH).trim();
}

export function isValidPersonName(raw: string): boolean {
  return normalizePersonName(raw).length > 0;
}

export function firstName(name: string): string {
  return normalizePersonName(name).split(' ')[0] ?? '';
}

/** Só roda no cliente: no servidor não há `localStorage`, e quem chama lê num efeito. */
export function readPerson(movementId: string): string | null {
  try {
    const stored = window.localStorage.getItem(storageKey(movementId));

    return stored && isValidPersonName(stored) ? normalizePersonName(stored) : null;
  } catch {
    return null;
  }
}

/** Lança com nome inválido (RN-03): quem grava vazio faz a conta da mesa mostrar uma pessoa sem nome. */
export function savePerson(movementId: string, name: string): string {
  if (!isValidPersonName(name)) {
    throw new Error('savePerson exige um nome válido');
  }

  const normalized = normalizePersonName(name);

  try {
    window.localStorage.setItem(storageKey(movementId), normalized);
  } catch {
    // sem storage (navegação privada, quiosque), o nome vale só em memória até o reload
  }

  return normalized;
}
