/**
 * Contrato Canônico de Respostas para Server Actions
 * Padrão DRY unificado em toda a aplicação.
 */
export type ActionResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};
