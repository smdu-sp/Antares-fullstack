import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarTudo } from '@/lib/server/usuarios/buscar-tudo';

export const runtime = 'nodejs';

/** Porte de UsuariosController.buscarTudo (GET /usuarios/buscar-tudo). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;
    const busca = searchParams.get('busca') || undefined;
    const status = searchParams.get('status') || undefined;
    const dev = searchParams.get('dev') || undefined;

    const resultado = await buscarTudo(pagina, limite, busca, status, dev);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
