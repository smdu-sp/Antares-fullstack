import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requirePermissao } from '@/lib/server/auth/permissao';
import { buscarPorNumeroSei } from '@/lib/server/processos/buscar-por-numero-sei';

export const runtime = 'nodejs';

type Params = { params: Promise<{ numero_sei: string }> };

/** Porte de ProcessosController.buscarPorNumeroSei (GET /processos/numero-sei/:numero_sei). */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requirePermissao(usuario.id, 'processo.visualizar', request.headers.get('x-grupo-ativo-id'));

    const { numero_sei } = await params;
    const resultado = await buscarPorNumeroSei(numero_sei, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
