import { Prisma } from '@prisma/client';

const USUARIO_SELECT = { id: true, nome: true, nomeSocial: true, login: true, email: true } as const;

/** Include padrão usado por buscarTudo/buscarPorId/buscarPorNumeroSei/atualizar no backend original. */
export const PROCESSO_INCLUDE_PADRAO = {
  interessado: true,
  unidadeRemetente: true,
  unidadeDestino: true,
  andamentos: {
    where: { ativo: true },
    orderBy: { criadoEm: 'desc' },
    include: {
      usuario: { select: USUARIO_SELECT },
      usuarioProrrogacao: { select: USUARIO_SELECT },
    },
  },
  grupo: { select: { id: true, codigo: true, nome: true } },
} satisfies Prisma.processoInclude;
