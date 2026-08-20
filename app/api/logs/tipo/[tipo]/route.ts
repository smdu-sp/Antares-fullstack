import { NextRequest } from 'next/server';
import type { TipoAcao } from '@prisma/client';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarPorTipoAcao } from '@/lib/server/logs/buscar-por-tipo-acao';

export const runtime = 'nodejs';

type Params = { params: Promise<{ tipo: string }> };

/** Porte de LogsController.buscarPorTipo (GET /logs/tipo/:tipo). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV', 'ADM']);

    const { tipo } = await params;
    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;

    const resultado = await buscarPorTipoAcao(tipo as TipoAcao, pagina, limite);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
