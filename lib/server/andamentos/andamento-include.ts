import { Prisma } from '@prisma/client';

/** Include padrão usado pelo backend original em quase todos os métodos de andamentos. */
export const ANDAMENTO_INCLUDE_PADRAO = {
  processo: true,
  usuario: true,
  usuarioProrrogacao: true,
} satisfies Prisma.andamentoInclude;
