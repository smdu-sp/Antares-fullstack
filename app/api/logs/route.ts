import { NextRequest } from 'next/server';
import { TipoAcao } from '@prisma/client';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { buscarTudo } from '@/lib/server/logs/buscar-tudo';

export const runtime = 'nodejs';

/** Porte de LogsController.buscarTudo (GET /logs). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV', 'ADM']);

    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;
    const tipoAcao = (searchParams.get('tipoAcao') as TipoAcao | null) || undefined;
    const entidadeTipo = searchParams.get('entidadeTipo') || undefined;
    const entidadeId = searchParams.get('entidadeId') || undefined;
    const usuario_id = searchParams.get('usuario_id') || undefined;
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;

    const resultado = await buscarTudo(pagina, limite, {
      tipoAcao,
      entidadeTipo,
      entidadeId,
      usuario_id,
      dataInicio,
      dataFim,
    });

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
