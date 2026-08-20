import { GrupoCodigo, GrupoTipo } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Porte de UsuariosService.sincronizarGrupoLegado (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function sincronizarGrupoLegado(usuarioId: string): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { permissao: true },
  });

  if (!usuario) return;

  if (usuario.permissao === 'DEV') {
    await prisma.grupo.upsert({
      where: { codigo_tipo: { codigo: GrupoCodigo.GLOBAL, tipo: GrupoTipo.DIVISAO } },
      create: {
        codigo: GrupoCodigo.GLOBAL,
        tipo: GrupoTipo.DIVISAO,
        nome: 'Grupo DEV (uso interno)',
        ativo: true,
      },
      update: { nome: 'Contexto Global (DEV)', ativo: true },
    });
  }
}
