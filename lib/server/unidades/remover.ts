import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { buscarPorId } from './buscar-por-id';

/** Porte de UnidadesService.remover (Antares-backend/src/unidades/unidades.service.ts). */
export async function remover(id: string) {
  await buscarPorId(id);

  const usuarios = await prisma.usuario.findMany({ where: { unidade_id: id, status: true } });
  if (usuarios.length > 0) {
    throw new HttpError(
      400,
      `Não é possível remover a unidade pois existem ${usuarios.length} usuário(s) ativo(s) relacionado(s). Remova ou altere a unidade dos usuários primeiro.`,
    );
  }

  const processos = await prisma.processo.findMany({ where: { unidade_id: id, ativo: true } });
  if (processos.length > 0) {
    throw new HttpError(
      400,
      `Não é possível remover a unidade pois existem ${processos.length} processo(s) ativo(s) relacionado(s). Remova ou altere a unidade dos processos primeiro.`,
    );
  }

  await prisma.unidade.update({ where: { id }, data: { ativo: false } });
  return { removido: true };
}
