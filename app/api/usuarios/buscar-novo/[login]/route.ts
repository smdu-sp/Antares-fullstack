import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarNovo } from '@/lib/server/usuarios/buscar-novo';

export const runtime = 'nodejs';

type Params = { params: Promise<{ login: string }> };

/** Porte de UsuariosController.buscarNovo (GET /usuarios/buscar-novo/:login). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { login } = await params;
    const resultado = await buscarNovo(login);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
