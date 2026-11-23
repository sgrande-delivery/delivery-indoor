const STORAGE_KEY = 'indoor:board-session';

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/** O `session` da URL vence o guardado: QR novo é movimentação nova. Só roda no cliente. */
export function readEntrySession(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('session');

  return fromUrl || readStored();
}

export function rememberSession(id: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // sem storage (navegação privada, quiosque), vale só a URL
  }
}

export function forgetSession(id: string): void {
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) === id) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sem storage, não há o que remover
  }
}
