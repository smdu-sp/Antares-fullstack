import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { criar } from '@/lib/server/unidades/criar';
import { buscarTudo } from '@/lib/server/unidades/buscar-tudo';
import { createUnidadeSchema } from '@/lib/server/validation/unidades.schema';

export const runtime = 'nodejs';

/** Porte de UnidadesController.criar (POST /unidades). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    // Criar unidade não é exclusivo da página admin — a grid de processos cria
    // uma unidade inline ao editar a célula, pra qualquer papel
    // (components/unidade-autocomplete-editor.tsx). Só editar/remover uma
    // unidade já cadastrada (rotas [id], listagem paginada da página admin)
    // fica exclusivo de DEV.
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const body = await request.json();
    const dados = createUnidadeSchema.parse(body);
    const unidade = await criar(dados);

    return jsonResponse(unidade, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Porte de UnidadesController.buscarTudo (GET /unidades). */
export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    await requirePermissoes(usuario.id, ['DEV']);

    const { searchParams } = new URL(request.url);
    const pagina = Number(searchParams.get('pagina')) || undefined;
    const limite = Number(searchParams.get('limite')) || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await buscarTudo(pagina, limite, busca);

    return jsonResponse(resultado);
  } catch (error) {
    return handleRouteError(error);
  }
}
