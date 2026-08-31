import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar } from '@/lib/server/usuarios/criar';
import { createUsuarioSchema } from '@/lib/server/validation/usuarios.schema';

export const runtime = 'nodejs';

/** Porte de UsuariosController.criar (POST /usuarios/criar). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const usuarioLogado = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    if (!usuarioLogado) throw new HttpError(401, 'Usuário não encontrado.');

    const body = await request.json();
    const dados = createUsuarioSchema.parse(body);
    const novoUsuario = await criar(dados, usuarioLogado);

    return jsonResponse(novoUsuario, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
