export const OFFLINE_BANNER_TITLE = 'Sem conexão';

export const OFFLINE_BANNER_ACTION_LABEL = 'Tentar agora';

export const OFFLINE_RESTORED_MESSAGE = 'Conexão restabelecida';

export function offlineBannerLine(lastSyncedClock: string | null): string {
  if (lastSyncedClock === null) {
    return 'O que está na tela pode estar desatualizado. As novidades aparecem quando a internet voltar.';
  }

  return `O que está na tela é de ${lastSyncedClock}. As novidades aparecem quando a internet voltar.`;
}
