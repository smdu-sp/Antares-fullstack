import { Permissao, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';

/** Porte de UsuariosService.listarPermissoesDev (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function listarPermissoesDev(
  paginaInput?: number,
  limiteInput?: number,
  busca?: string,
  permissao?: string,
  status?: string,
) {
  // Nota: o parâmetro `limite=20` do método original do backend é sobrescrito
  // por verificaPagina (que sempre normaliza ausência/valor inválido para 10) —
  // preservado aqui como estava, não é um bug desta migração.
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const where: Prisma.UsuarioWhereInput = {
    ...(busca && {
      OR: [{ nome: { contains: busca } }, { login: { contains: busca } }, { email: { contains: busca } }],
    }),
    ...(permissao && permissao !== '' && { permissao: permissao as Permissao }),
    ...(status &&
      status !== '' && {
        status: status === 'ATIVO' ? true : status === 'INATIVO' ? false : undefined,
      }),
  };

  const total = await prisma.usuario.count({ where });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const usuarios = await prisma.usuario.findMany({
    where,
    orderBy: { nome: 'asc' },
    skip: (pagina - 1) * limite,
    take: limite,
    include: { unidade: { select: { id: true, nome: true, sigla: true } } },
  });

  return { total, pagina, limite, data: usuarios };
}
