import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { atualizar } from '@/lib/server/usuarios/atualizar';
import { updateUsuarioSchema } from '@/lib/server/validation/usuarios.schema';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Porte de UsuariosController.atualizar (PATCH /usuarios/atualizar/:id). */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const usuarioLogado = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    if (!usuarioLogado) throw new HttpError(401, 'Usuário não encontrado.');

    const { id } = await params;
    const body = await request.json();
    const dados = updateUsuarioSchema.parse(body);
    const resultado = await atualizar(usuarioLogado, id, dados);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
