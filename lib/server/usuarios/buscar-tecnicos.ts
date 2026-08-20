import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de UsuariosService.buscarTecnicos (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function buscarTecnicos() {
  const lista = await prisma.usuario.findMany({
    where: { permissao: 'TEC' },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  });

  if (!lista || lista.length === 0) throw new HttpError(403, 'Nenhum técnico encontrado.');

  return lista;
}
