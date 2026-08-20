import { Permissao, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';

const UNIDADE_SELECT = { id: true, nome: true, sigla: true } as const;

/** Porte de UsuariosService.buscarTudo (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function buscarTudo(
  paginaInput?: number,
  limiteInput?: number,
  busca?: string,
  status?: string,
  permissao?: string,
) {
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const searchParams: Prisma.UsuarioWhereInput = {
    ...(busca && {
      OR: [
        { nome: { contains: busca } },
        { nomeSocial: { contains: busca } },
        { login: { contains: busca } },
        { email: { contains: busca } },
      ],
    }),
    ...(status &&
      status !== '' && {
        status: status === 'ATIVO' ? true : status === 'INATIVO' ? false : undefined,
      }),
    ...(permissao && permissao !== '' && { permissao: permissao as Permissao }),
  };

  const total = await prisma.usuario.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const usuarios = await prisma.usuario.findMany({
    where: searchParams,
    orderBy: { nome: 'asc' },
    skip: (pagina - 1) * limite,
    take: limite,
    include: { unidade: { select: UNIDADE_SELECT } },
  });

  return { total, pagina, limite, data: usuarios };
}
