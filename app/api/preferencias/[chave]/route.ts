import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { HttpError } from '@/lib/server/http-error';
import { buscar } from '@/lib/server/preferencias/buscar';
import { deletar } from '@/lib/server/preferencias/deletar';

export const runtime = 'nodejs';

type Params = { params: Promise<{ chave: string }> };

/** Porte de PreferenciasController.buscar (GET /preferencias/:chave). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);

    const { chave } = await params;
    const preferencia = await buscar(usuario.id, chave);
    if (!preferencia) throw new HttpError(404, 'Preferência não encontrada');

    return jsonResponse(preferencia);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de PreferenciasController.deletar (DELETE /preferencias/:chave). */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);

    const { chave } = await params;
    const resultado = await deletar(usuario.id, chave);
    if (!resultado.success) throw new HttpError(404, resultado.message ?? 'Preferência não encontrada');

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
