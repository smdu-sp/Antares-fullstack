import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de UsuariosService.listaCompleta (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function listaCompleta() {
  const lista = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    include: { unidade: { select: { id: true, nome: true, sigla: true } } },
  });

  if (!lista || lista.length === 0) throw new HttpError(403, 'Nenhum usuário encontrado.');

  return lista;
}
