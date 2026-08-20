import { CHAVE_GRUPO_ATIVO } from '@/lib/server/auth/grupo-ativo';

/**
 * Chaves de `preferencias_usuario` usadas internamente pelo sistema (fora do
 * controle direto do usuário) e que não podem ser escritas via a API genérica
 * de preferências — só pelos endpoints dedicados que fazem a validação certa
 * (ex.: `auth.grupo_ativo_id` só via PATCH /grupo-ativo).
 */
export const CHAVES_PREFERENCIA_RESERVADAS: readonly string[] = [CHAVE_GRUPO_ATIVO];
