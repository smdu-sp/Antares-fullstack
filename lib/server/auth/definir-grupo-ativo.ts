import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { usuarioEhMembroGabinete } from '@/lib/server/shared/grupo-processo';
import { CHAVE_GRUPO_ATIVO } from './grupo-ativo';

async function persistirGrupoAtivo(usuarioId: string, grupoId: string) {
  await prisma.preferenciasUsuario.upsert({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    create: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO, valor: grupoId, ativo: true },
    update: { valor: grupoId, ativo: true, atualizadoEm: new Date() },
  });
}

/** Porte de AuthService.definirGrupoAtivo (Antares-backend/src/auth/auth.service.ts). */
export async function definirGrupoAtivo(usuarioId: string, grupoId: string) {
  const vinculo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, grupo_id: grupoId, ativo: true, grupo: { ativo: true } },
    include: { grupo: { select: { id: true, codigo: true, nome: true, tipo: true } } },
  });

  if (vinculo) {
    await persistirGrupoAtivo(usuarioId, grupoId);
    return { sucesso: true, grupoAtivo: vinculo.grupo };
  }

  // Visão do Gabinete: permite selecionar qualquer grupo ativo real mesmo sem
  // vínculo próprio — ver usuarioTemPermissao() em resolver-permissoes.ts pra onde
  // isso vira acesso de fato (honorário, escopado a processo/andamento).
  if (await usuarioEhMembroGabinete(usuarioId)) {
    const grupo = await prisma.grupo.findFirst({
      where: { id: grupoId, ativo: true },
      select: { id: true, codigo: true, nome: true, tipo: true },
    });

    if (grupo) {
      await persistirGrupoAtivo(usuarioId, grupoId);
      return { sucesso: true, grupoAtivo: grupo };
    }
  }

  throw new HttpError(403, 'Grupo informado nao esta vinculado ao usuario.');
}
