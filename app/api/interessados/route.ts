import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/http/json-response';
import { handleRouteError } from '@/lib/http/handle-route-error';
import { requireAuth } from '@/lib/server/auth/session';
import { requirePermissoes } from '@/lib/server/auth/permissoes';
import { criar } from '@/lib/server/interessados/criar';
import { buscarTudo } from '@/lib/server/interessados/buscar-tudo';
import { createInteressadoSchema } from '@/lib/server/validation/interessados.schema';

export const runtime = 'nodejs';

/** Porte de InteressadosController.criar (POST /interessados). */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    // Criar interessado não é exclusivo da página admin — a grid de processos
    // cria (ou reativa) um interessado inline ao editar a célula, pra qualquer
    // papel (components/interessado-autocomplete-cell-editor.tsx). Só a edição/
    // remoção de um interessado já cadastrado (rotas [id]) fica exclusiva de DEV.
    await requirePermissoes(usuario.id, ['ADM', 'TEC', 'USR']);

    const body = await request.json();
    const dados = createInteressadoSchema.parse(body);
    const interessado = await criar(dados);

    return jsonResponse(interessado, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Listagem paginada — usada pela página admin (/interessados), exclusiva de DEV
 * (mesmo padrão de GET /unidades; a listagem sem paginação usada em
 * autocomplete/grid continua em /interessados/lista-completa, aberta a todos). */
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
