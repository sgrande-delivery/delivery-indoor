export const boardCopy = {
  title: 'Conta da mesa',
  back: 'Voltar ao cardápio',
  refresh: 'Atualizar a conta',
  loading: 'Carregando a conta',
  errorTitle: 'Não conseguimos carregar a conta',
  errorDescription:
    'A mesa continua aberta e nada foi perdido. Verifique a conexão e tente de novo — ou chame o garçom, que ele vê a conta no caixa.',
  refreshFailed: 'Não foi possível atualizar a conta.',
} as const;

export function describeBoardSubtitle(restaurantName: string | null | undefined, boardNumber: string): string {
  return restaurantName ? `${restaurantName} · Mesa ${boardNumber}` : `Mesa ${boardNumber}`;
}
