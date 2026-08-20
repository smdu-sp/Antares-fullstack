import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { CHAVE_GRUPO_ATIVO } from './grupo-ativo';

/** Porte de AuthService.definirGrupoAtivo (Antares-backend/src/auth/auth.service.ts). */
export async function definirGrupoAtivo(usuarioId: string, grupoId: string) {
  const vinculo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, grupo_id: grupoId, ativo: true, grupo: { ativo: true } },
    include: { grupo: { select: { id: true, codigo: true, nome: true, tipo: true } } },
  });

  if (!vinculo) {
    throw new HttpError(403, 'Grupo informado nao esta vinculado ao usuario.');
  }

  await prisma.preferenciasUsuario.upsert({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    create: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO, valor: grupoId, ativo: true },
    update: { valor: grupoId, ativo: true, atualizadoEm: new Date() },
  });

  return { sucesso: true, grupoAtivo: vinculo.grupo };
}
