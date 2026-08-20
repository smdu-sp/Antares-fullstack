import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { requireCapacidade } from '@/lib/server/auth/capacidade';
import { criar } from '@/lib/server/andamentos/criar';
import { buscarTudo } from '@/lib/server/andamentos/buscar-tudo';
import { createAndamentoSchema } from '@/lib/server/validation/andamentos.schema';

export const runtime = 'nodejs';

/** Porte de AndamentosController.criar (POST /andamentos). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC']);
    await requireCapacidade(usuario.id, 'andamento.modificar', request.headers.get('x-grupo-ativo-id'));

    const body = await request.json();
    const dados = createAndamentoSchema.parse(body);
    const andamento = await criar(dados, usuario.id);

    return jsonResponse(andamento, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de AndamentosController.buscarTudo (GET /andamentos). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);
    await requireCapacidade(usuario.id, 'andamento.visualizar', request.headers.get('x-grupo-ativo-id'));

    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;
    const processo_id = searchParams.get('processo_id') || undefined;
    const status = searchParams.get('status') || undefined;

    const resultado = await buscarTudo(pagina, limite, processo_id, status, usuario.id);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
