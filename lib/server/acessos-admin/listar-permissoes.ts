import { prisma } from '@/lib/prisma';

/** Catálogo de permissões disponíveis (Permissoes), para o painel DEV montar seletores. */
export async function listarPermissoes() {
  const permissoes = await prisma.permissoes.findMany({
    where: { ativo: true },
    orderBy: [{ codigo: 'asc' }],
  });
  return { total: permissoes.length, data: permissoes };
}
