/** @format */

import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import * as processo from "@/services/processos";
import * as unidade from "@/services/unidades";
import {
  IPaginadoProcesso,
  IProcesso,
  IPoliticaColunasProcesso,
} from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import FiltroVencendoHoje from "./processos/_components/filtro-vencendo-hoje";
import FiltroAtrasados from "./processos/_components/filtro-atrasados";
import FiltroConcluidos from "./processos/_components/filtro-concluidos";
import { ProcessosGrid } from "./_components/processos-grid";
import { BtnLimparFiltros } from "@/components/btn-limpar-filtros";
import MetricsToggle from "./_components/metrics-toggle";
import { AlertCircle } from "lucide-react";

function normalizarCampoColuna(coluna: string): string {
  if (coluna === "usuario_atribuido_id") return "usuario_atribuido_nome";
  if (coluna === "responsavel") return "usuario_atribuido_nome";
  if (coluna === "responsável") return "usuario_atribuido_nome";
  if (coluna === "responsavel_processo") return "usuario_atribuido_nome";
  return coluna;
}

function extrairArrayStrings(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map(normalizarCampoColuna);
}

function extrairPoliticaColunas(
  payload: unknown,
): IPoliticaColunasProcesso | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as {
    colunasFixas?: unknown;
    colunasDisponiveis?: unknown;
    ordemPadrao?: unknown;
    ordemUsuario?: unknown;
    ordemEfetiva?: unknown;
    chavePreferenciaOrdem?: unknown;
  };

  return {
    colunasFixas: extrairArrayStrings(data.colunasFixas),
    colunasDisponiveis: extrairArrayStrings(data.colunasDisponiveis),
    ordemPadrao: extrairArrayStrings(data.ordemPadrao),
    ordemUsuario: extrairArrayStrings(data.ordemUsuario),
    ordemEfetiva: extrairArrayStrings(data.ordemEfetiva),
    chavePreferenciaOrdem:
      typeof data.chavePreferenciaOrdem === "string"
        ? data.chavePreferenciaOrdem
        : undefined,
  };
}

export default async function HomeSuspense({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<ProcessosGridSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

function ProcessosGridSkeleton() {
  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let { pagina = 1, limite = 100, total = 0 } = await searchParams;
  let ok = false;
  const {
    busca = "",
    interessado: interessadoFiltro = "",
    unidade: unidadeFiltro = "",
    vencendoHoje = "",
    atrasados = "",
    concluidos = "",
  } = await searchParams;

  // Garantir que os parâmetros sejam strings
  const buscaStr = Array.isArray(busca) ? busca[0] || "" : busca;
  const interessadoFiltroStr = Array.isArray(interessadoFiltro)
    ? interessadoFiltro[0] || ""
    : interessadoFiltro;
  const unidadeFiltroStr = Array.isArray(unidadeFiltro)
    ? unidadeFiltro[0] || ""
    : unidadeFiltro;
  const vencendoHojeStr = Array.isArray(vencendoHoje)
    ? vencendoHoje[0] || ""
    : vencendoHoje;
  const atrasadosStr = Array.isArray(atrasados)
    ? atrasados[0] || ""
    : atrasados;
  const concluidosStr = Array.isArray(concluidos)
    ? concluidos[0] || ""
    : concluidos;
  let dados: IProcesso[] = [];
  let unidadesLista: IUnidade[] = [];
  let colunasProcessosConfig: string[] = [];
  let chavePreferenciaOrdem: string | undefined;
  let exibirAtribuicaoUsuario = false;
  let grupoAtivoInvalido = false;

  const session = await auth();
  if (session && session.access_token) {
    const grupoAtivoId = session.grupoAtivo?.id;

    if (!grupoAtivoId) {
      grupoAtivoInvalido = true;
    } else {
      const politicaColunasResponse =
        await processo.query.buscarPoliticaColunas(
          session.access_token,
          grupoAtivoId,
        );

      if (politicaColunasResponse.ok && politicaColunasResponse.data) {
        const politica = extrairPoliticaColunas(politicaColunasResponse.data);
        const colunasDisponiveis = politica?.colunasDisponiveis || [];
        const colunasFixas = politica?.colunasFixas || [];
        const ordemEfetiva = politica?.ordemEfetiva || [];
        const ordemPadrao = politica?.ordemPadrao || [];

        const colunasPermitidas = Array.from(
          new Set([...colunasFixas, ...colunasDisponiveis]),
        );

        const baseOrdem = ordemEfetiva.length
          ? ordemEfetiva
          : ordemPadrao.length
            ? ordemPadrao
            : colunasPermitidas;

        const ordenadas = baseOrdem.filter((coluna) =>
          colunasPermitidas.includes(coluna),
        );

        const faltantes = colunasPermitidas.filter(
          (coluna) => !ordenadas.includes(coluna),
        );

        colunasProcessosConfig = [...ordenadas, ...faltantes];
        chavePreferenciaOrdem = politica?.chavePreferenciaOrdem;
        exibirAtribuicaoUsuario = colunasProcessosConfig.includes(
          "usuario_atribuido_nome",
        );
      }

      const response = await processo.query.buscarTudo(
        session.access_token || "",
        Number(pagina),
        Number(limite),
        buscaStr,
        vencendoHojeStr === "true",
        atrasadosStr === "true",
        unidadeFiltroStr || undefined,
        grupoAtivoId,
        interessadoFiltroStr || undefined,
        concluidosStr === "true",
      );
      const { data } = response;
      ok = response.ok;
      if (ok) {
        if (data) {
          const paginado = data as IPaginadoProcesso;
          pagina = paginado.pagina || 1;
          limite = paginado.limite || 10;
          total = paginado.total || 0;
          dados = (paginado.data || []).map((p: any) => {
            // Normaliza interessado: backend retorna objeto {id, valor}, grid espera string
            if (p.interessado && typeof p.interessado === "object") {
              p.interessado = p.interessado.valor || "";
            }
            return p;
          });
        }
      }

      const unidadesResponse = await unidade.listaCompleta(
        session.access_token,
      );

      if (unidadesResponse.ok && unidadesResponse.data) {
        unidadesLista = unidadesResponse.data as IUnidade[];
      }

      // A lista completa de interessados (pode ser um payload grande) é
      // carregada sob demanda pelo próprio ProcessosSpreadsheet no cliente,
      // não aqui — evita pesar toda busca com esse fetch.

      // Métricas do dashboard (totais, vencendo hoje, atrasados, andamentos etc.)
      // são carregadas sob demanda pelo MetricsToggle (painel "Mostrar Resumo"),
      // não aqui — evita pesar toda busca com a leitura completa de andamentos.
    }
  }

  return (
    <div className="w-full flex justify-center relative pb-20 md:pb-14 h-full">
      <div className="w-full px-1.5 sm:px-4 md:px-8 min-w-0">
        {/* Header com Título */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 mt-4 sm:gap-4 sm:mb-6 sm:mt-6">
          <h1 className="text-lg sm:text-1xl md:text-3xl font-bold">
            Processos
          </h1>
        </div>

        {grupoAtivoInvalido && (
          <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">
                  Selecione um grupo ativo para continuar
                </p>
                <p className="text-sm opacity-90">
                  Use o menu do usuário no canto inferior esquerdo e escolha um
                  grupo ativo.
                </p>
              </div>
            </div>
          </div>
        )}

        {!grupoAtivoInvalido && (
          <>
            {/* Métricas com Toggle (carregadas sob demanda ao abrir o painel) */}
            <MetricsToggle />

            <div className="flex flex-col gap-2 my-3 sm:gap-4 sm:my-5 w-full min-w-0">
              {/* Barra de Busca com Auto-Search */}
              <Filtros
                camposFiltraveis={[
                  {
                    nome: "Buscar Processo",
                    tag: "busca",
                    tipo: 0,
                    placeholder:
                      "Buscar em número SEI, assunto, interessado, observações...",
                  },
                  {
                    nome: "Interessado",
                    tag: "interessado",
                    tipo: 0,
                    placeholder: "Filtrar por interessado...",
                  },
                  {
                    nome: "Unidade (Remetente/Destinatária)",
                    tag: "unidade",
                    tipo: 0,
                    placeholder:
                      "Filtrar por unidade remetente ou destinatária...",
                  },
                ]}
                showSearchButton={false}
                showClearButton={false}
                autoSearch={true}
                debounceMs={300}
                clearOtherFiltersOnSearch={false}
              />

              {/* Filtros Rápidos com Botão Limpar */}
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-stretch sm:items-center flex-wrap min-w-0">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground flex-shrink-0">
                  Filtros rápidos:
                </span>
                <div className="flex flex-wrap gap-1 sm:gap-2 flex-1 min-w-0">
                  <FiltroVencendoHoje />
                  <FiltroAtrasados />
                  <FiltroConcluidos />
                </div>
                <BtnLimparFiltros />
              </div>
            </div>

            {/* Visualização de Processos com Seleção */}
            <ProcessosGrid
              processos={dados}
              unidades={unidadesLista}
              colunasProcessos={colunasProcessosConfig}
              chavePreferenciaOrdem={chavePreferenciaOrdem}
              exibirAtribuicaoUsuario={exibirAtribuicaoUsuario}
              busca={buscaStr}
              interessado={interessadoFiltroStr}
              unidade={unidadeFiltroStr}
              vencendoHoje={vencendoHojeStr === "true"}
              atrasados={atrasadosStr === "true"}
              concluidos={concluidosStr === "true"}
            />

            {dados && dados.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <Pagination total={+total} pagina={+pagina} limite={+limite} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
