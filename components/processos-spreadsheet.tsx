/** @format */

"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  useContext,
  createContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ICellRendererParams,
  ValueSetterParams,
  GridReadyEvent,
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { IProcesso, IAndamento, StatusAndamento } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { IInteressado } from "@/types/interessado";
import { IUsuarioTecnico } from "@/types/usuario";
import * as processoService from "@/services/processos";
import * as andamento from "@/services/andamentos";
import * as interessadoService from "@/services/interessados";
import * as usuarioService from "@/services/usuarios";
import { salvarPreferencia, buscarPreferencia } from "@/services/preferencias";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseUTCDate } from "@/app/(rotas-auth)/processos/_components/utils";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  FileDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DateCellEditor from "@/components/date-cell-editor";
import ModalDeleteProcesso from "@/app/(rotas-auth)/processos/_components/modal-delete-processo";
import ModalDeleteAndamento from "@/app/(rotas-auth)/processos/_components/modal-delete-andamento";
import InteressadoAutocompleteCellEditor from "@/components/interessado-autocomplete-cell-editor";
import UnidadeAutocompleteEditor from "@/components/unidade-autocomplete-editor";
import { ExportAndamentoButton } from "@/components/export-andamento-button";
import { ExportProcessoButton } from "@/components/export-processo-button";
import { ExportProcessosEmLote } from "@/components/export-processos-em-lote";
import { useSelectedProcessos } from "@/hooks/use-selected-processos";
import { canAdmin } from "@/lib/access-control";

const COLUNAS_FIXAS_UI = ["checkbox", "expand", "acoes"];

// Cores de destaque (prazo vencido/vence hoje/vence em breve, concluído) usadas
// nas células/linhas da grid. As versões de tema escuro usam fundo translúcido
// (em vez do mesmo hex claro do tema claro) porque um fundo pastel sólido fica
// "estourado"/sem contraste sobre o fundo escuro do app.
const CORES_DESTAQUE = {
  verde: {
    light: { backgroundColor: "#dcfce7", color: "#15803d" },
    dark: { backgroundColor: "rgba(34, 197, 94, 0.18)", color: "#4ade80" },
  },
  vermelho: {
    light: { backgroundColor: "#fee", color: "#c00" },
    dark: { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171" },
  },
  laranja: {
    light: { backgroundColor: "#ffebcc", color: "#cc6600" },
    dark: { backgroundColor: "rgba(249, 115, 22, 0.2)", color: "#fb923c" },
  },
  amarelo: {
    light: { backgroundColor: "#ffc", color: "#880" },
    dark: { backgroundColor: "rgba(234, 179, 8, 0.2)", color: "#facc15" },
  },
  amareloClaro: {
    light: { backgroundColor: "#ffe", color: "#990" },
    dark: { backgroundColor: "rgba(234, 179, 8, 0.14)", color: "#eab308" },
  },
  transparente: {
    light: { backgroundColor: "transparent", color: "inherit" },
    dark: { backgroundColor: "transparent", color: "inherit" },
  },
} as const;

function corDestaque(
  cor: keyof typeof CORES_DESTAQUE,
  isDark: boolean,
): { backgroundColor: string; color: string } {
  return CORES_DESTAQUE[cor][isDark ? "dark" : "light"];
}

// Registrar todos os módulos da comunidade AG-Grid
ModuleRegistry.registerModules([AllCommunityModule]);

// Contexto para permitir que o headerComponent do AG-Grid (renderizado via portal)
// reaja a mudanças de estado do componente pai sem depender de api.refreshHeader().
const ExpandirTudoContext = createContext<{
  allExpanded: boolean;
  toggleAll: () => void;
} | null>(null);

function ExpandirTudoHeader() {
  const ctx = useContext(ExpandirTudoContext);
  if (!ctx) return null;

  return (
    <button
      type="button"
      onClick={ctx.toggleAll}
      className="flex items-center justify-center w-full h-full hover:bg-gray-100 transition-colors"
      title={ctx.allExpanded ? "Recolher tudo" : "Expandir tudo"}
    >
      {ctx.allExpanded ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

// Componente para mostrar andamentos como detalhe expansível
function AndamentosDetail({
  processo,
  unidades,
  interessados,
}: {
  processo: IProcesso;
  unidades: IUnidade[];
  interessados: IInteressado[];
}) {
  const { data: session } = useSession();
  const { theme, systemTheme } = useTheme();
  // columnDefs abaixo é criado só uma vez (useMemo com deps []), então o
  // cellStyle preso naquele closure nunca veria um `theme` atualizado — por
  // isso lê de uma ref mantida em sincronia, não da variável direta.
  const isDarkModeRef = useRef(false);
  useEffect(() => {
    isDarkModeRef.current =
      theme === "dark" || (theme === "system" && systemTheme === "dark");
    // Força o cellStyle a reavaliar com a ref já atualizada — sem isso a
    // troca de tema em runtime não recolore as células já desenhadas.
    gridRef.current?.api?.refreshCells({ force: true });
  }, [theme, systemTheme]);
  const [andamentos, setAndamentos] = useState<IAndamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [isEditingAssunto, setIsEditingAssunto] = useState(false);
  const [novoAssunto, setNovoAssunto] = useState(processo.assunto);
  const [isSavingAssunto, setIsSavingAssunto] = useState(false);
  const [isEditingInteressado, setIsEditingInteressado] = useState(false);
  const [inputInteressado, setInputInteressado] = useState(
    processo.interessado || "",
  );
  const [selectedInteressadoId, setSelectedInteressadoId] = useState(
    processo.interessado_id || "",
  );
  const [isSavingInteressado, setIsSavingInteressado] = useState(false);
  const [suggestionsInteressado, setSuggestionsInteressado] = useState<
    IInteressado[]
  >([]);
  const [showSuggestionsInteressado, setShowSuggestionsInteressado] =
    useState(false);
  const timeoutRefInteressado = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  const router = useRouter();
  const savingRef = useRef<Set<string>>(new Set()); // Prevenir salvamentos duplicados

  useEffect(() => {
    async function loadAndamentos() {
      if (!session?.access_token || !processo.id || loaded) return;

      setLoading(true);
      try {
        const response = await andamento.query.buscarPorProcesso(
          session.access_token,
          processo.id,
          session.grupoAtivo?.id,
        );
        if (response.ok && response.data) {
          // Mapear 'resposta' do backend para 'data_resposta' do tipo
          const andamentosComMapeamento = (
            Array.isArray(response.data) ? response.data : []
          ).map((a: any) => ({
            ...a,
            data_resposta: a.resposta || a.data_resposta,
          }));
          setAndamentos(andamentosComMapeamento);
        }
      } catch (error) {
        // Erro ao carregar andamentos
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    loadAndamentos();
  }, [processo.id, session?.access_token, session?.grupoAtivo?.id, loaded, unidades]);

  const adicionarAndamento = () => {
    const novoAndamento: any = {
      id: `temp-${Date.now()}`,
      processo_id: processo.id,
      origem: "",
      destino: "",
      data_envio: new Date().toISOString(),
      prazo: null,
      prorrogacao: null,
      status: "EM_ANDAMENTO",
      data_resposta: null,
      observacao: "",
      _isNew: true,
    };
    setAndamentos([...andamentos, novoAndamento]);
  };

  const handleSaveAssunto = async () => {
    if (!novoAssunto.trim()) {
      toast.error("O assunto não pode estar vazio");
      return;
    }

    if (novoAssunto === processo.assunto) {
      setIsEditingAssunto(false);
      return;
    }

    setIsSavingAssunto(true);
    try {
      const response = await processoService.server.atualizar(processo.id, {
        assunto: novoAssunto.trim(),
      });

      if (response.ok) {
        toast.success("Assunto atualizado com sucesso");
        setIsEditingAssunto(false);
        router.refresh();
      } else {
        toast.error("Erro ao atualizar assunto", {
          description: response.error,
        });
        setNovoAssunto(processo.assunto);
      }
    } catch (error) {
      toast.error("Erro ao atualizar assunto");
      setNovoAssunto(processo.assunto);
    } finally {
      setIsSavingAssunto(false);
    }
  };

  const handleCancelEdit = () => {
    setNovoAssunto(processo.assunto);
    setIsEditingAssunto(false);
  };

  const fetchSuggestionsInteressado = (q: string) => {
    if (!q || q.length < 1) {
      setSuggestionsInteressado(interessados);
      return;
    }
    const filtrados = interessados.filter((i) =>
      i.valor.toLowerCase().includes(q.toLowerCase()),
    );
    setSuggestionsInteressado(filtrados);
  };

  const handleChangeInteressado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputInteressado(value);
    setSelectedInteressadoId("");
    if (timeoutRefInteressado.current) {
      clearTimeout(timeoutRefInteressado.current);
    }
    timeoutRefInteressado.current = setTimeout(() => {
      fetchSuggestionsInteressado(value);
      setShowSuggestionsInteressado(true);
    }, 250);
  };

  const handleSelectInteressado = (inter: IInteressado) => {
    setInputInteressado(inter.valor);
    setSelectedInteressadoId(inter.id);
    setShowSuggestionsInteressado(false);
    setSuggestionsInteressado([]);
  };

  const handleCancelEditInteressado = () => {
    setInputInteressado(processo.interessado || "");
    setSelectedInteressadoId(processo.interessado_id || "");
    setIsEditingInteressado(false);
    setShowSuggestionsInteressado(false);
  };

  const handleSaveInteressado = async () => {
    const valorDigitado = inputInteressado.trim();

    if (
      valorDigitado === (processo.interessado || "") &&
      selectedInteressadoId === (processo.interessado_id || "")
    ) {
      setIsEditingInteressado(false);
      return;
    }

    setIsSavingInteressado(true);
    try {
      let interessadoIdFinal = selectedInteressadoId;

      // Se não há um interessado selecionado mas há texto digitado,
      // tenta encontrar um existente com o mesmo nome ou cria um novo
      if (!interessadoIdFinal && valorDigitado) {
        const existente = interessados.find(
          (i) => i.valor.toLowerCase() === valorDigitado.toLowerCase(),
        );
        if (existente) {
          interessadoIdFinal = existente.id;
        } else {
          const respostaInteressado = await interessadoService.server.criar({
            valor: valorDigitado,
          });
          if (respostaInteressado.ok && respostaInteressado.data) {
            interessadoIdFinal = respostaInteressado.data.id;
            toast.success("Novo interessado criado");
          } else {
            toast.error("Erro ao criar interessado", {
              description: respostaInteressado.error,
            });
            setIsSavingInteressado(false);
            return;
          }
        }
      }

      const response = await processoService.server.atualizar(processo.id, {
        interessado_id: interessadoIdFinal || null,
      });

      if (response.ok) {
        toast.success("Interessado atualizado com sucesso");
        setIsEditingInteressado(false);
        router.refresh();
      } else {
        toast.error("Erro ao atualizar interessado", {
          description: response.error,
        });
        handleCancelEditInteressado();
      }
    } catch (error) {
      toast.error("Erro ao atualizar interessado");
      handleCancelEditInteressado();
    } finally {
      setIsSavingInteressado(false);
    }
  };

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      if (!session?.access_token) return;

      const andamentoAtualizado = event.data as IAndamento;
      const isNew = (andamentoAtualizado as any)._isNew;
      const saveKey = `${andamentoAtualizado.id}-${event.colDef.field}`;

      // Verificar se o valor realmente mudou
      if (event.oldValue === event.newValue) {
        return;
      }

      // IMPORTANTE: Ignorar mudanças onde newValue está vazio mas oldValue tinha valor
      // Isso acontece durante Fast Refresh quando o AG-Grid re-renderiza
      // Se vem de um valor válido (como 'CPU - ...') para vazio, é um artefato de renderização
      if (
        !event.newValue &&
        event.oldValue &&
        typeof event.oldValue === "string" &&
        event.oldValue.trim() !== ""
      ) {
        // Não fazer nada - apenas ignorar este evento falso
        return;
      }

      // Prevenir múltiplas requisições simultâneas do mesmo andamento
      if (savingRef.current.has(andamentoAtualizado.id)) {
        return;
      }

      // Prevenir múltiplas requisições simultâneas do mesmo campo
      if (savingRef.current.has(saveKey)) {
        return;
      }

      // Validar campos obrigatórios antes de salvar no backend
      // Campos obrigatórios: origem, destino, data_envio, status
      // Prazo é OPCIONAL
      // IMPORTANTE: usar newValue do evento, pois valueSetter é chamado DEPOIS de onCellValueChanged
      const field = event.colDef.field as string;
      const camposObrigatorios = {
        origem:
          field === "origem" ? event.newValue : andamentoAtualizado.origem,
        destino:
          field === "destino" ? event.newValue : andamentoAtualizado.destino,
        data_envio:
          field === "data_envio"
            ? event.newValue
            : andamentoAtualizado.data_envio,
        status:
          field === "status" ? event.newValue : andamentoAtualizado.status,
      };

      const camposFaltando = Object.entries(camposObrigatorios)
        .filter(([, valor]) => {
          if (!valor) return true;
          if (typeof valor === "string" && valor.trim() === "") return true;
          return false;
        })
        .map(([campo]) => campo);

      if (camposFaltando.length > 0) {
        // Valor foi salvo no grid, apenas não enviamos ao backend ainda
        return;
      }

      // Marcar como salvando - ambos o andamento e o campo específico
      savingRef.current.add(andamentoAtualizado.id);
      savingRef.current.add(saveKey);

      try {
        const dataToSave: any = {
          processo_id: processo.id,
          // Usar event.newValue para campos que foram alterados, do objeto para os outros
          origem:
            field === "origem" ? event.newValue : andamentoAtualizado.origem,
          destino:
            field === "destino" ? event.newValue : andamentoAtualizado.destino,
          data_envio:
            field === "data_envio"
              ? event.newValue
              : andamentoAtualizado.data_envio,
          prazo: field === "prazo" ? event.newValue : andamentoAtualizado.prazo,
          prorrogacao:
            field === "prorrogacao"
              ? event.newValue
              : andamentoAtualizado.prorrogacao,
          status:
            field === "status" ? event.newValue : andamentoAtualizado.status,
          assunto:
            field === "assunto" ? event.newValue : andamentoAtualizado.assunto,
          resposta:
            field === "data_resposta"
              ? event.newValue
              : andamentoAtualizado.data_resposta,
          observacao:
            field === "observacao"
              ? event.newValue
              : andamentoAtualizado.observacao,
        };

        // Converter campos de data para ISO
        const convertDateField = (value: any) => {
          if (value === null || value === undefined || value === "")
            return null;
          if (typeof value === "string" && value.includes("T")) {
            // Já é ISO, retornar como está
            return value;
          }
          if (typeof value === "string" && value.includes("-")) {
            // Formato YYYY-MM-DD, adicionar T00:00:00
            return new Date(value + "T00:00:00").toISOString();
          }
          return new Date(value).toISOString();
        };

        // Converter datas para ISO
        if (dataToSave.data_envio)
          dataToSave.data_envio = convertDateField(dataToSave.data_envio);
        if (dataToSave.prazo)
          dataToSave.prazo = convertDateField(dataToSave.prazo);
        if (dataToSave.prorrogacao)
          dataToSave.prorrogacao = convertDateField(dataToSave.prorrogacao);
        if (dataToSave.resposta)
          dataToSave.resposta = convertDateField(dataToSave.resposta);

        // Se data_resposta foi inserida e o status não é CONCLUIDO, marcar como CONCLUIDO automaticamente
        if (
          field === "data_resposta" &&
          event.newValue &&
          dataToSave.status !== StatusAndamento.CONCLUIDO
        ) {
          dataToSave.status = StatusAndamento.CONCLUIDO;
          andamentoAtualizado.status = StatusAndamento.CONCLUIDO;
        }

        // IMPORTANTE: Remover campos null/undefined do payload
        // Alguns backends rejeitam null, então é melhor não enviar o campo
        Object.keys(dataToSave).forEach((key) => {
          if (dataToSave[key] === null || dataToSave[key] === undefined) {
            delete dataToSave[key];
          }
        });

        let response: any;
        if (isNew) {
          response = await andamento.server.criar(dataToSave);
          const errorMessage = Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error;
          if (response.ok && response.data) {
            // IMPORTANTE: Manter os dados que enviamos se a resposta não os incluir
            // Isso previne perder dados quando o servidor não retorna o objeto completo
            const responseData = {
              ...response.data,
              // Garantir que origem e destino não sejam perdidos
              origem: response.data.origem || dataToSave.origem,
              destino: response.data.destino || dataToSave.destino,
            };
            // Atualizar com o ID real do servidor
            const updatedAndamentos = andamentos.map((a) =>
              (a as any).id === andamentoAtualizado.id ? responseData : a,
            );
            setAndamentos(updatedAndamentos as IAndamento[]);
            toast.success("Andamento criado com sucesso");
          }
        } else {
          response = await andamento.server.atualizar(
            andamentoAtualizado.id,
            dataToSave,
          );
          if (response.ok) {
            // Atualizar o estado local com os dados salvos
            const updatedAndamentos = andamentos.map((a) => {
              if (a.id === andamentoAtualizado.id) {
                return {
                  ...a,
                  status: dataToSave.status || a.status,
                  data_resposta:
                    dataToSave.data_resposta !== undefined
                      ? dataToSave.data_resposta
                      : a.data_resposta,
                };
              }
              return a;
            });
            setAndamentos(updatedAndamentos);
            toast.success("Andamento atualizado com sucesso");
          }
        }

        if (!response.ok) {
          const errorMessage = Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error;
          toast.error("Erro ao salvar andamento", {
            description: errorMessage,
          });
          // NÃO chamar setDataValue - isso causa outro onCellValueChanged
          // event.node.setDataValue(event.colDef.field as string, event.oldValue);
        }
      } catch (error) {
        toast.error("Erro ao salvar andamento");
        // NÃO chamar setDataValue - isso causa outro onCellValueChanged
        // event.node.setDataValue(event.colDef.field as string, event.oldValue);
      } finally {
        // Remover da lista de salvamento
        savingRef.current.delete(saveKey);
        savingRef.current.delete(andamentoAtualizado.id);
      }
    },
    [session?.access_token, processo.id, andamentos],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "origem",
        headerName: "Origem",
        editable: true,
        cellEditor: UnidadeAutocompleteEditor,
        valueSetter: (params) => {
          params.data.origem = params.newValue;
          return true;
        },
        width: 200,
      },
      {
        field: "assunto",
        headerName: "Assunto",
        editable: true,
        width: 300,
        wrapText: true,
        autoHeight: true,
        valueSetter: (params) => {
          params.data.assunto = params.newValue || null;
          return true;
        },
      },
      {
        field: "destino",
        headerName: "Destino",
        editable: true,
        cellEditor: UnidadeAutocompleteEditor,
        valueSetter: (params) => {
          params.data.destino = params.newValue;
          return true;
        },
        width: 200,
      },
      {
        field: "data_envio",
        headerName: "Data Envio",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          return parseUTCDate(params.data?.data_envio);
        },
        valueSetter: (params) => {
          params.data.data_envio = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        width: 130,
      },
      {
        field: "prazo",
        headerName: "Prazo",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          return parseUTCDate(params.data?.prazo);
        },
        valueSetter: (params) => {
          params.data.prazo = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        cellStyle: (params: any) => {
          const andamento = params.data as IAndamento;
          const isDark = isDarkModeRef.current;
          // Se concluído, colorir de verde
          if (andamento.status === StatusAndamento.CONCLUIDO) {
            return corDestaque("verde", isDark);
          }

          if (!params.value) return corDestaque("transparente", isDark);

          const prazo = params.value as Date;
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil(
            (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diffDays < 0) {
            // Vencido - Vermelho
            return corDestaque("vermelho", isDark);
          } else if (diffDays === 0) {
            // Vence hoje - Laranja
            return corDestaque("laranja", isDark);
          } else if (diffDays === 1) {
            // Vence amanhã - Amarelo
            return corDestaque("amarelo", isDark);
          }
          return corDestaque("transparente", isDark);
        },
        width: 130,
      },
      {
        field: "prorrogacao",
        headerName: "Prorrogação",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          return parseUTCDate(params.data?.prorrogacao);
        },
        valueSetter: (params) => {
          params.data.prorrogacao = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        width: 130,
      },
      {
        field: "status",
        headerName: "Status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["EM_ANDAMENTO", "CONCLUIDO", "PENDENTE", "CANCELADO"],
        },
        width: 150,
      },
      {
        field: "data_resposta",
        headerName: "Data Resposta",
        editable: true,
        cellEditor: DateCellEditor,
        valueGetter: (params) => {
          return parseUTCDate(params.data?.data_resposta);
        },
        valueSetter: (params) => {
          params.data.data_resposta = params.newValue
            ? params.newValue.toISOString()
            : null;
          return true;
        },
        valueFormatter: (params) => {
          if (!params.value) return "";
          return format(params.value, "dd/MM/yyyy", { locale: ptBR });
        },
        width: 150,
      },
      {
        field: "observacao",
        headerName: "Observação",
        editable: true,
        width: 250,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Ações",
        field: "acoes",
        width: 120,
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (params: ICellRendererParams) => {
          const andamentoData = params.data as IAndamento;

          const handleSuccess = () => {
            const updatedAndamentos = andamentos.filter(
              (a) => a.id !== andamentoData.id,
            );
            setAndamentos(updatedAndamentos);
          };

          return (
            <div className="flex items-center justify-center h-full gap-1">
              <ExportAndamentoButton andamentoId={andamentoData.id} />
              <ModalDeleteAndamento
                andamento={andamentoData}
                onSuccess={handleSuccess}
              />
            </div>
          );
        },
      },
    ],
    [andamentos],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
    }),
    [],
  );

  // Calcular altura dinâmica baseada no número de andamentos
  const gridHeight = useMemo(() => {
    const minHeight = 300; // Altura mínima
    const maxHeight = 800; // Altura máxima
    const rowHeight = 50; // Altura aproximada de cada linha
    const headerHeight = 56; // Altura do header

    const calculatedHeight = headerHeight + andamentos.length * rowHeight;

    // Se tiver poucos andamentos, usar altura mínima
    // Se tiver muitos, usar altura máxima com scroll
    return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
  }, [andamentos.length]);

  return (
    <div
      className={`p-6 bg-gradient-to-r ${
        theme === "dark" || (theme === "system" && systemTheme === "dark")
          ? "from-gray-900 to-gray-800"
          : "from-gray-50 to-gray-100"
      }`}
      style={{ width: "100%", minHeight: "200px" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-lg font-semibold ${
            theme === "dark" || (theme === "system" && systemTheme === "dark")
              ? "text-gray-200"
              : "text-gray-700"
          }`}
        >
          Andamentos do Processo - {processo.numero_sei}
        </h3>
        <Button
          onClick={adicionarAndamento}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Novo Andamento
        </Button>
      </div>

      {/* Interessado do Processo */}
      <div className="relative mb-4 p-3 rounded-md bg-opacity-50 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Interessado do Processo:
        </p>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 relative">
            {isEditingInteressado ? (
              <>
                <Input
                  value={inputInteressado}
                  onChange={handleChangeInteressado}
                  placeholder="Busque pelo nome do interessado..."
                  className="text-sm font-medium"
                  autoComplete="off"
                  autoFocus
                  onFocus={() => {
                    fetchSuggestionsInteressado(inputInteressado);
                    setShowSuggestionsInteressado(true);
                  }}
                  onBlur={() =>
                    setTimeout(
                      () => setShowSuggestionsInteressado(false),
                      200,
                    )
                  }
                />
                {showSuggestionsInteressado &&
                  suggestionsInteressado.length > 0 && (
                    <ul className="absolute z-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md mt-1 w-full max-h-48 overflow-auto shadow-lg">
                      {suggestionsInteressado.map((inter) => (
                        <li
                          key={inter.id}
                          className="px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onMouseDown={() => handleSelectInteressado(inter)}
                        >
                          {inter.valor}
                        </li>
                      ))}
                    </ul>
                  )}
              </>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words font-medium">
                {processo.interessado || "Nenhum interessado definido"}
              </p>
            )}
          </div>
          {!isEditingInteressado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingInteressado(true)}
              className="flex-shrink-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEditingInteressado && (
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEditInteressado}
              disabled={isSavingInteressado}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveInteressado}
              disabled={isSavingInteressado}
            >
              <Check className="h-4 w-4 mr-1" />
              {isSavingInteressado ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      {/* Assunto do Processo */}
      <div className="mb-4 p-3 rounded-md bg-opacity-50 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Assunto do Processo:
        </p>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditingAssunto ? (
              <Textarea
                value={novoAssunto}
                onChange={(e) => setNovoAssunto(e.target.value)}
                placeholder="Digite o novo assunto..."
                className="text-sm font-medium min-h-16 resize-none"
                autoFocus
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words font-medium">
                {processo.assunto}
              </p>
            )}
          </div>
          {!isEditingAssunto && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingAssunto(true)}
              className="flex-shrink-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEditingAssunto && (
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSavingAssunto}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAssunto}
              disabled={isSavingAssunto}
            >
              <Check className="h-4 w-4 mr-1" />
              {isSavingAssunto ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <div
        className={`ag-theme-alpine w-full ${
          theme === "dark" || (theme === "system" && systemTheme === "dark")
            ? "dark"
            : ""
        }`}
        style={
          {
            height: `${gridHeight}px`,
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
            ...(theme === "dark" ||
            (theme === "system" && systemTheme === "dark")
              ? {
                  "--ag-background-color": "#1a1a1a",
                  "--ag-header-background-color": "#262626",
                  "--ag-header-foreground-color": "#e5e7eb",
                  "--ag-odd-row-background-color": "#1a1a1a",
                  "--ag-row-hover-color": "#2d2d2d",
                  "--ag-border-color": "#404040",
                  "--ag-foreground-color": "#e5e7eb",
                  "--ag-secondary-foreground-color": "#a3a3a3",
                  "--ag-cell-horizontal-padding": "12px",
                }
              : {}),
          } as React.CSSProperties
        }
      >
        <AgGridReact
          ref={gridRef}
          rowData={andamentos}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          suppressHorizontalScroll={false}
          alwaysShowVerticalScroll={true}
          theme="legacy"
          // Passar dados dinâmicos para os cell editors
          context={{
            unidades: unidades,
            interessados: interessados,
          }}
          overlayNoRowsTemplate="Nenhum andamento cadastrado"
        />
      </div>
    </div>
  );
}

interface ProcessosSpreadsheetProps {
  processos: IProcesso[];
  unidades: IUnidade[];
  colunasProcessos?: string[];
  chavePreferenciaOrdem?: string;
  exibirAtribuicaoUsuario?: boolean;
  busca?: string;
  interessado?: string;
  unidade?: string;
  vencendoHoje?: boolean;
  atrasados?: boolean;
  concluidos?: boolean;
}

export default function ProcessosSpreadsheet({
  processos,
  unidades,
  colunasProcessos = [],
  chavePreferenciaOrdem,
  exibirAtribuicaoUsuario = false,
  busca = "",
  interessado = "",
  unidade = "",
  vencendoHoje = false,
  atrasados = false,
  concluidos = false,
}: ProcessosSpreadsheetProps) {
  const gridRef = useRef<AgGridReact>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  // Ver mesma nota em AndamentosDetail: columnDefs/getRowStyle são criados uma
  // vez só, então lêem o tema de uma ref sempre atualizada, não da variável.
  const isDarkModeRef = useRef(false);
  useEffect(() => {
    isDarkModeRef.current =
      theme === "dark" || (theme === "system" && systemTheme === "dark");
    // Força cellStyle/getRowStyle a reavaliar com a ref já atualizada — sem
    // isso a troca de tema em runtime não recolore linhas/células já desenhadas.
    gridRef.current?.api?.redrawRows();
  }, [theme, systemTheme]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const expandedRowsRef = useRef<Set<string>>(new Set());
  const [processosLocal, setProcessosLocal] = useState<IProcesso[]>(processos);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<
    IUsuarioTecnico[]
  >([]);
  const [interessados, setInteressados] = useState<IInteressado[]>([]);
  const chavePreferencia = useMemo(() => {
    const chave = (chavePreferenciaOrdem || "").trim();
    return chave || "processos-colunas-ordem";
  }, [chavePreferenciaOrdem]);
  const { selectedIds, toggleSelect, toggleSelectAll } =
    useSelectedProcessos();
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const processosLocalRef = useRef<IProcesso[]>(processos);
  const usuariosResponsaveisRef = useRef<IUsuarioTecnico[]>([]);
  const interessadosRef = useRef<IInteressado[]>([]);

  // Mapa de versões para controle de conflito
  const versionsRef = useRef<Map<string, Date>>(new Map());

  // Prevenir salvamentos duplicados
  const savingRef = useRef<Set<string>>(new Set());

  // Flag para indicar que estamos restaurando o estado (não salvar durante restauração)
  const isRestoringRef = useRef<boolean>(false);

  // Flag para indicar que já restauramos (evitar restaurar múltiplas vezes)
  const hasRestoredRef = useRef<boolean>(false);

  // Timer para debounce do salvamento
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar processos locais quando props mudar
  const initializedRef = useRef(false);
  useEffect(() => {
    setProcessosLocal(processos);
    // Manter apenas expandedRows para processos que ainda existem
    setExpandedRows((prev) => {
      const newExpanded = new Set<string>();
      const currentIds = new Set(processos.map((p) => p.id));
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          newExpanded.add(id);
        }
      });
      return newExpanded;
    });
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, [processos]);

  useEffect(() => {
    usuariosResponsaveisRef.current = usuariosResponsaveis;
  }, [usuariosResponsaveis]);

  useEffect(() => {
    async function carregarResponsaveis() {
      if (!exibirAtribuicaoUsuario) {
        setUsuariosResponsaveis([]);
        return;
      }

      if (!session?.access_token) return;
      try {
        const grupoAtivoId = canAdmin(session?.usuario)
          ? undefined
          : session.grupoAtivo?.id;

        const response = await usuarioService.listaCompleta(
          session.access_token,
          grupoAtivoId,
        );
        if (response.ok && Array.isArray(response.data)) {
          setUsuariosResponsaveis(
            (response.data as any[])
              .map((responsavel) => ({
                id: String(responsavel?.id || ""),
                nome: String(responsavel?.nome || "").trim(),
              }))
              .filter((responsavel) => responsavel.id && responsavel.nome),
          );
        }
      } catch {
        toast.error("Erro ao carregar usuarios responsaveis");
      }
    }

    carregarResponsaveis();
    // session?.usuario fica de fora de propósito: o objeto session pode vir
    // com referência nova a cada render mesmo com os mesmos dados (comum com
    // useSession()), e canAdmin() só olha session.usuario.dev — colocar o
    // objeto inteiro na lista faria esse fetch refazer sem necessidade a cada
    // render. session?.grupoAtivo?.id já cobre a mudança que importa aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, session?.grupoAtivo?.id, exibirAtribuicaoUsuario]);

  // Lista de interessados carregada no cliente (uma vez), usada pelo
  // autocomplete de edição inline. Buscar isso no servidor a cada busca de
  // processos pesava demais a navegação (payload muito grande).
  useEffect(() => {
    async function carregarInteressados() {
      if (!session?.access_token) return;
      try {
        const response = await interessadoService.query.listaCompleta(
          session.access_token,
          session.grupoAtivo?.id,
        );
        if (Array.isArray(response)) {
          setInteressados(response);
        }
      } catch {
        toast.error("Erro ao carregar interessados");
      }
    }

    carregarInteressados();
  }, [session?.access_token, session?.grupoAtivo?.id]);

  // Sincronizar ref com state
  useEffect(() => {
    expandedRowsRef.current = expandedRows;
  }, [expandedRows]);

  useEffect(() => {
    selectedIdsRef.current = new Set(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    processosLocalRef.current = processosLocal;
  }, [processosLocal]);

  useEffect(() => {
    interessadosRef.current = interessados;
  }, [interessados]);

  // Criar dados da linha incluindo linhas de detalhe
  const rowData = useMemo(() => {
    const rows: any[] = [];
    processosLocal.forEach((processo) => {
      rows.push(processo);
      if (expandedRows.has(processo.id)) {
        rows.push({
          _isDetail: true,
          _parentId: processo.id,
          _processo: processo,
          id: `detail-${processo.id}`, // ID único para a linha de detalhe
        });
      }
    });
    return rows;
  }, [processosLocal, expandedRows]);

  useEffect(() => {
    // Inicializa versões apenas para processos que ainda não têm versão
    processosLocal.forEach((p) => {
      if (!(p as any)._isNew && !versionsRef.current.has(p.id)) {
        versionsRef.current.set(p.id, new Date(p.atualizadoEm));
      }
    });
  }, [processosLocal]);

  // Forçar atualização visual dos checkboxes quando seleção muda
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows();
    }
  }, [selectedIds]);

  // Cleanup do timer de salvamento ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    hasRestoredRef.current = false;
    isRestoringRef.current = false;
  }, [session?.grupoAtivo?.id, chavePreferencia]);

  // Restaurar preferências quando a sessão estiver disponível
  useEffect(() => {
    async function restaurarPreferencias() {
      if (!gridRef.current?.api || !session?.usuario) {
        return;
      }

      // Evitar restaurar múltiplas vezes
      if (isRestoringRef.current || hasRestoredRef.current) {
        return;
      }

      try {
        const preferencia = await buscarPreferencia(chavePreferencia);

        if (preferencia && preferencia.valor) {
          const ordemSalva = Array.isArray(preferencia.valor)
            ? preferencia.valor
                .map((col) => String(col || "").trim())
                .filter(Boolean)
            : [];

          if (!ordemSalva.length) {
            hasRestoredRef.current = true;
            return;
          }

          const colunasDisponiveisNaGrid = new Set(
            (gridRef.current.api.getColumnState() || [])
              .map((col) => String(col.colId || "").trim())
              .filter((colId) => colId && !COLUNAS_FIXAS_UI.includes(colId)),
          );

          const ordemValida = ordemSalva.filter((colId) =>
            colunasDisponiveisNaGrid.has(colId),
          );

          if (!ordemValida.length) {
            hasRestoredRef.current = true;
            return;
          }

          const estadoOrdem = ordemValida.map((colId) => ({ colId }));

          // Delay para garantir que tudo estabilizou
          setTimeout(() => {
            if (!gridRef.current?.api) return;

            isRestoringRef.current = true;
            hasRestoredRef.current = true;

            gridRef.current.api.applyColumnState({
              state: estadoOrdem,
              applyOrder: true,
            });

            gridRef.current.api.refreshHeader();

            // Manter bloqueio por mais tempo para evitar sobrescritas
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 2000); // 2 segundos de bloqueio
          }, 1000); // 1 segundo de delay inicial
        }
      } catch (error) {
        console.error("❌ Erro ao restaurar preferências:", error);
        isRestoringRef.current = false;
      }
    }

    restaurarPreferencias();
  }, [session?.usuario, session?.id, chavePreferencia, colunasProcessos]);

  // Debug: verificar se os dados estão chegando
  useEffect(() => {
    // Dados de debug removidos por segurança
  }, [unidades, interessados]);

  const unidadesOptions = useMemo(
    () => unidades.map((u) => `${u.sigla} - ${u.nome}`),
    [unidades],
  );

  const interessadosOptions = useMemo(
    () => interessados.map((i) => i.valor),
    [interessados],
  );

  const getNomeResponsavelById = useCallback((id?: string | null) => {
    if (!id) return "";
    const responsavel = usuariosResponsaveisRef.current.find(
      (u) => u.id === id,
    );
    return responsavel?.nome || "";
  }, []);

  // Calculado a cada render a partir do state real (não de refs/closures do AG-Grid),
  // para que o botão sempre reflita e alterne corretamente o estado atual.
  const todosExpandidos =
    processosLocal.length > 0 && expandedRows.size === processosLocal.length;

  const alternarExpandirTudo = () => {
    if (todosExpandidos) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(processosLocal.map((p) => p.id)));
    }
    // Sincronizar os ícones de cada linha (coluna "expand")
    setTimeout(() => {
      gridRef.current?.api?.refreshCells({ force: true });
    }, 0);
  };

  const adicionarProcesso = () => {
    const novoProcesso: any = {
      id: `temp-${Date.now()}`,
      numero_sei: "",
      assunto: "",
      interessado: "",
      interessado_id: "",
      origem: "",
      data_recebimento: new Date().toISOString().split("T")[0],
      prazo: "",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      _isNew: true,
    };

    if (exibirAtribuicaoUsuario) {
      novoProcesso.usuario_atribuido_id = "";
    }

    setProcessosLocal([novoProcesso, ...processosLocal]);
  };

  const compareDateValues = useCallback((valueA: unknown, valueB: unknown) => {
    const toTime = (value: unknown) => {
      if (!value) return null;
      if (value instanceof Date) return value.getTime();
      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.getTime();
      }
      return null;
    };

    const timeA = toTime(valueA);
    const timeB = toTime(valueB);

    if (timeA === null && timeB === null) return 0;
    if (timeA === null) return -1;
    if (timeB === null) return 1;
    return timeA - timeB;
  }, []);

  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: "",
          field: "checkbox",
          width: 50,
          pinned: "left" as const,
          lockPosition: true,
          headerComponent: () => {
            const processosAtuais = processosLocalRef.current;
            const allSelected =
              processosAtuais.length > 0 &&
              processosAtuais.every((p) => selectedIdsRef.current.has(p.id));

            return (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  toggleSelectAll(processosAtuais.map((p) => p.id))
                }
                title={allSelected ? "Deselecionar tudo" : "Selecionar tudo"}
                className="cursor-pointer"
                style={{ width: "14px", height: "14px" }}
              />
            );
          },
          cellRenderer: (params: ICellRendererParams) => {
            if (params.data?._isDetail) return null;

            const processo = params.data as IProcesso;
            const checked = selectedIdsRef.current.has(processo.id);

            return (
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSelect(processo.id)}
                className="cursor-pointer"
                style={{ width: "14px", height: "14px" }}
              />
            );
          },
          sortable: false,
          filter: false,
          editable: false,
        },
        {
          headerName: "",
          field: "expand",
          width: 50,
          pinned: "left" as const,
          lockPosition: true,
          headerComponent: ExpandirTudoHeader,
          cellRenderer: (params: ICellRendererParams) => {
            if (params.data?._isDetail) return null;

            const processo = params.data as IProcesso;
            const isExpanded = expandedRowsRef.current.has(processo.id);

            return (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedRowsRef.current);
                  if (expandedRowsRef.current.has(processo.id)) {
                    newExpanded.delete(processo.id);
                  } else {
                    newExpanded.add(processo.id);
                  }
                  setExpandedRows(newExpanded);
                  // Forçar atualização da grid após mudança
                  setTimeout(() => {
                    if (gridRef.current?.api) {
                      gridRef.current.api.refreshCells({ force: true });
                    }
                  }, 0);
                }}
                className="flex items-center justify-center w-full h-full hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            );
          },
          sortable: false,
          filter: false,
          editable: false,
        },
        {
          field: "numero_sei",
          headerName: "Nº SEI",
          editable: true,
          pinned: "left" as const,
          width: 150,
          cellStyle: { fontWeight: "bold" },
        },
        {
          field: "assunto",
          headerName: "Assunto",
          editable: true,
          width: 250,
          valueFormatter: (params: any) => {
            const value = params.value || "";
            return value.length > 80 ? value.substring(0, 80) + "..." : value;
          },
          tooltipField: "assunto",
          cellStyle: {
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        },
        {
          field: "origem",
          headerName: "Origem",
          editable: true,
          cellEditor: UnidadeAutocompleteEditor,
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            return processo.origem || "";
          },
          valueFormatter: (params: any) => params.value || "",
          valueSetter: (params: ValueSetterParams) => {
            const selected = params.newValue as string;
            if (selected) {
              params.data.origem = selected;
              return true;
            }
            return false;
          },
          width: 200,
        },
        {
          field: "interessado",
          headerName: "Interessado",
          editable: true,
          cellEditor: InteressadoAutocompleteCellEditor,
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            return processo.interessado || "";
          },
          valueFormatter: (params: any) => {
            const value = params.value || "";
            return value.toUpperCase();
          },
          valueSetter: (params: ValueSetterParams) => {
            // O novo valor vem do autocomplete
            const newValue = params.newValue as string;

            // Tentar encontrar o interessado nos existentes
            let interessadoObj = interessadosRef.current.find(
              (i) => i.valor === newValue,
            );

            // Se não encontrou, criar um novo (será persistido no backend)
            if (!interessadoObj && newValue.trim()) {
              // Para novo interessado digitado, usamos um ID temporário
              // O backend será responsável de criar e retornar o ID real
              interessadoObj = {
                id: `temp-${Date.now()}`,
                valor: newValue,
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
              };
            }

            if (interessadoObj && params.node) {
              params.data.interessado = interessadoObj.valor;
              params.data.interessado_id = interessadoObj.id;
              params.data._interessadoChanged = true;

              // Forçar atualização visual
              params.api.refreshCells({
                rowNodes: [params.node],
                columns: [params.column],
                force: true,
              });
              return true;
            }
            return false;
          },
          width: 200,
        },
        ...(exibirAtribuicaoUsuario
          ? [
              {
                field: "usuario_atribuido_nome",
                headerName: "Responsável",
                editable: true,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: () => ({
                  values: [
                    "Nao atribuido",
                    ...usuariosResponsaveisRef.current.map(
                      (responsavel) => responsavel.nome,
                    ),
                  ],
                }),
                valueGetter: (params: any) => {
                  if (params.data?._isDetail) return "";
                  const processo = params.data as IProcesso;
                  if (!processo.usuario_atribuido_id) return "Nao atribuido";
                  return (
                    getNomeResponsavelById(processo.usuario_atribuido_id) ||
                    "Nao atribuido"
                  );
                },
                valueFormatter: (params: any) =>
                  params.value || "Nao atribuido",
                valueSetter: (params: ValueSetterParams) => {
                  const nomeSelecionado = String(params.newValue || "");

                  if (!nomeSelecionado || nomeSelecionado === "Nao atribuido") {
                    params.data.usuario_atribuido_id = null;
                    params.data.usuarioAtribuido = null;
                    return true;
                  }

                  const responsavelSelecionado =
                    usuariosResponsaveisRef.current.find(
                      (responsavel) => responsavel.nome === nomeSelecionado,
                    );

                  if (!responsavelSelecionado) return false;

                  params.data.usuario_atribuido_id = responsavelSelecionado.id;
                  params.data.usuarioAtribuido = {
                    id: responsavelSelecionado.id,
                    nome: responsavelSelecionado.nome,
                  };
                  return true;
                },
                width: 180,
              },
            ]
          : []),
        {
          field: "unidadeRemetente",
          headerName: "Unidade Remetente",
          editable: true,
          cellEditor: UnidadeAutocompleteEditor,
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            if (processo.unidadeRemetente) {
              return `${processo.unidadeRemetente.sigla} - ${processo.unidadeRemetente.nome}`;
            }
            return "";
          },
          valueFormatter: (params: any) => params.value || "",
          valueSetter: (params: ValueSetterParams) => {
            const selected = params.newValue as string;
            const sigla = selected?.split(" - ")[0];
            const unidade = unidades.find((u) => u.sigla === sigla);
            if (unidade) {
              params.data.unidadeRemetente = unidade;
              return true;
            }
            return false;
          },
          width: 200,
        },
        {
          field: "unidadeDestino",
          headerName: "Unidade Destinatária",
          editable: true,
          cellEditor: UnidadeAutocompleteEditor,
          valueGetter: (params: any) => {
            if (params.data?._isDetail) return "";
            const processo = params.data as IProcesso;
            if (processo.unidadeDestino) {
              return `${processo.unidadeDestino.sigla} - ${processo.unidadeDestino.nome}`;
            }
            return "";
          },
          valueFormatter: (params: any) => params.value || "",
          valueSetter: (params: ValueSetterParams) => {
            const selected = params.newValue as string;
            const sigla = selected?.split(" - ")[0];
            const unidade = unidades.find((u) => u.sigla === sigla);
            if (unidade) {
              params.data.unidadeDestino = unidade;
              return true;
            }
            return false;
          },
          width: 200,
        },
        {
          field: "data_recebimento",
          headerName: "Data Recebimento",
          editable: true,
          cellEditor: DateCellEditor,
          comparator: (valueA, valueB) => compareDateValues(valueA, valueB),
          sortingOrder: ["desc", "asc", null],
          valueGetter: (params: any) => {
            if (!params.data?.data_recebimento) return null;
            return parseUTCDate(params.data.data_recebimento);
          },
          valueSetter: (params: any) => {
            params.data.data_recebimento = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          width: 160,
        },
        {
          field: "data_envio_unidade",
          headerName: "Data Envio para Unidade",
          editable: true,
          cellEditor: DateCellEditor,
          comparator: (valueA, valueB) => compareDateValues(valueA, valueB),
          valueGetter: (params: any) => {
            if (!params.data?.data_envio_unidade) return null;
            return parseUTCDate(params.data.data_envio_unidade);
          },
          valueSetter: (params: any) => {
            params.data.data_envio_unidade = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          width: 200,
        },
        {
          field: "prazo",
          headerName: "Prazo",
          editable: true,
          cellEditor: DateCellEditor,
          comparator: (valueA, valueB) => compareDateValues(valueA, valueB),
          valueGetter: (params: any) => {
            if (!params.data?.prazo) return null;
            return parseUTCDate(params.data.prazo);
          },
          valueSetter: (params: any) => {
            params.data.prazo = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          cellStyle: (params: any) => {
            const processo = params.data as IProcesso;
            const isDark = isDarkModeRef.current;
            // Se concluído, não colorir
            if (isProcessoConcluido(processo)) {
              return corDestaque("transparente", isDark);
            }

            if (!params.value) return corDestaque("transparente", isDark);
            const prazo = params.value as Date;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil(
              (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (diffDays < 0) {
              return corDestaque("vermelho", isDark);
            } else if (diffDays === 0) {
              return corDestaque("amarelo", isDark);
            } else if (diffDays <= 3) {
              return corDestaque("amareloClaro", isDark);
            }
            return corDestaque("transparente", isDark);
          },
          width: 120,
        },
        {
          field: "data_prorrogacao",
          headerName: "Prorrogação",
          editable: true,
          cellEditor: DateCellEditor,
          comparator: (valueA, valueB) => compareDateValues(valueA, valueB),
          valueGetter: (params: any) => {
            return parseUTCDate(params.data?.data_prorrogacao);
          },
          valueSetter: (params: any) => {
            params.data.data_prorrogacao = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          width: 130,
        },
        {
          field: "data_resposta_final",
          headerName: "Data Resposta Final",
          editable: true,
          cellEditor: DateCellEditor,
          comparator: (valueA, valueB) => compareDateValues(valueA, valueB),
          valueGetter: (params: any) => {
            return parseUTCDate(params.data?.data_resposta_final);
          },
          valueSetter: (params: any) => {
            params.data.data_resposta_final = params.newValue
              ? params.newValue.toISOString()
              : null;
            return true;
          },
          valueFormatter: (params: any) => {
            if (!params.value) return "";
            return format(params.value, "dd/MM/yyyy", {
              locale: ptBR,
            });
          },
          width: 180,
        },
        {
          field: "resposta_final",
          headerName: "Observações",
          editable: true,
          width: 300,
          wrapText: true,
          autoHeight: true,
        },
        {
          headerName: "Ações",
          field: "acoes",
          width: 120,
          pinned: "right" as const,
          sortable: false,
          filter: false,
          editable: false,
          cellRenderer: (params: ICellRendererParams) => {
            if (params.data?._isDetail) return null;

            const processo = params.data as IProcesso;

            return (
              <div className="flex items-center justify-center h-full gap-1">
                <ExportProcessoButton processoId={processo.id} />
                <ModalDeleteProcesso id={processo.id} />
              </div>
            );
          },
        },
      ] as ColDef[],
    // SEM dependências, de propósito — recriar columnDefs a cada render em que
    // compareDateValues/exibirAtribuicaoUsuario/getNomeResponsavelById/
    // isProcessoConcluido/toggleSelect/toggleSelectAll/unidades mudassem de
    // referência faria o AG-Grid resetar colunas inteiras (perde largura/ordem
    // customizada, redesenha tudo) — o próprio motivo de existir desse comentário
    // original. `unidades` só é populado uma vez por carregamento de página, e as
    // funções de callback leem estado/props atuais via fechos que só executam
    // quando o AG-Grid de fato chama o cellRenderer/valueGetter (não no momento
    // da criação do array), então não ficam presas em valores velhos na prática.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const colunasRenderizadas = useMemo(() => {
    if (!colunasProcessos.length) return columnDefs;

    const colunasFixas = new Set(COLUNAS_FIXAS_UI);
    const colunasPermitidas = new Set(colunasProcessos);
    const colunasBase = columnDefs.filter((coluna) => {
      const field = String(coluna.field || "");
      if (!field) return true;
      if (colunasFixas.has(field)) return true;
      return colunasPermitidas.has(field);
    });

    const mapaColunas = new Map(
      colunasBase
        .map((coluna) => [String(coluna.field || ""), coluna] as const)
        .filter(([field]) => !!field),
    );

    const esquerda = colunasBase.filter((coluna) => {
      const field = String(coluna.field || "");
      return field === "checkbox" || field === "expand";
    });

    const direita = colunasBase.filter((coluna) => {
      const field = String(coluna.field || "");
      return field === "acoes";
    });

    const dinamicasOrdenadas = colunasProcessos
      .map((field) => mapaColunas.get(field))
      .filter((coluna): coluna is ColDef => !!coluna)
      .filter((coluna) => {
        const field = String(coluna.field || "");
        return !colunasFixas.has(field);
      });

    const camposDinamicos = new Set(
      dinamicasOrdenadas.map((coluna) => String(coluna.field || "")),
    );

    const dinamicasFaltantes = colunasBase.filter((coluna) => {
      const field = String(coluna.field || "");
      if (!field || colunasFixas.has(field)) return false;
      return !camposDinamicos.has(field);
    });

    return [
      ...esquerda,
      ...dinamicasOrdenadas,
      ...dinamicasFaltantes,
      ...direita,
    ];
  }, [columnDefs, colunasProcessos]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      editable: (params) => !params.data?._isDetail,
    }),
    [],
  );

  const onCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      if (!session?.access_token) return;

      const processoAtualizado = event.data as IProcesso;
      const field = event.colDef.field as string;
      const oldValue = event.oldValue;
      const newValue = event.newValue;
      const isNew = (processoAtualizado as any)._isNew;

      // Verificar se houve alteração real
      if (oldValue === newValue && !isNew) return;

      const saveKey = `${processoAtualizado.id}-${field}`;

      // Prevenir múltiplas requisições simultâneas do mesmo processo
      if (savingRef.current.has(processoAtualizado.id)) {
        return;
      }

      // Prevenir múltiplas requisições simultâneas do mesmo campo
      if (savingRef.current.has(saveKey)) {
        return;
      }

      // Se for novo processo, verificar campos obrigatórios primeiro
      if (isNew) {
        if (
          !processoAtualizado.numero_sei ||
          !processoAtualizado.assunto ||
          !processoAtualizado.origem
        ) {
          // Ainda faltam campos obrigatórios, não salvar
          return;
        }
      }

      // Prevenir múltiplas requisições simultâneas do mesmo processo
      if (savingRef.current.has(processoAtualizado.id)) {
        return;
      }

      // Prevenir múltiplas requisições simultâneas do mesmo campo
      if (savingRef.current.has(saveKey)) {
        return;
      }

      // Marcar como salvando
      savingRef.current.add(processoAtualizado.id);
      savingRef.current.add(saveKey);

      // Se for novo processo, criar
      if (isNew) {
        try {
          // Helper para converter data
          const convertDateField = (value: any) => {
            if (!value) return undefined;
            if (typeof value === "string" && value.includes("-")) {
              // Se está no formato YYYY-MM-DD, converter para ISO completo
              return new Date(value + "T00:00:00").toISOString();
            }
            return new Date(value).toISOString();
          };

          // Se tem um interessado com ID temporário, criar primeiro
          let interessadoIdFinal = processoAtualizado.interessado_id;
          if (
            interessadoIdFinal &&
            interessadoIdFinal.startsWith("temp-") &&
            processoAtualizado.interessado
          ) {
            try {
              const novoInteressado = {
                valor: processoAtualizado.interessado,
              };
              const respostaInteressado =
                await interessadoService.server.criar(novoInteressado);
              if (respostaInteressado.ok && respostaInteressado.data) {
                interessadoIdFinal = respostaInteressado.data.id;
                toast.success("Novo interessado criado");
              } else {
                toast.error("Erro ao criar interessado", {
                  description: respostaInteressado.error,
                });
                return;
              }
            } catch (error) {
              toast.error("Erro ao criar interessado");
              return;
            }
          }

          const dataToCreate: any = {
            numero_sei: processoAtualizado.numero_sei,
            assunto: processoAtualizado.assunto,
            origem:
              typeof processoAtualizado.origem === "string" &&
              processoAtualizado.origem.includes(" - ")
                ? processoAtualizado.origem.split(" - ")[0]
                : processoAtualizado.origem,
            data_recebimento:
              convertDateField(processoAtualizado.data_recebimento) ||
              new Date().toISOString(),
          };

          if (interessadoIdFinal) {
            dataToCreate.interessado_id = interessadoIdFinal;
          }
          if (processoAtualizado.unidadeRemetente?.id) {
            dataToCreate.unidade_remetente_id =
              processoAtualizado.unidadeRemetente.id;
          } else if (
            typeof (processoAtualizado as any).unidadeRemetente === "string" &&
            (processoAtualizado as any).unidadeRemetente.includes(" - ")
          ) {
            const sigla = (processoAtualizado as any).unidadeRemetente.split(
              " - ",
            )[0];
            const unidade = unidades.find((u) => u.sigla === sigla);
            if (unidade) {
              dataToCreate.unidade_remetente_id = unidade.id;
            }
          }
          // Não enviar unidade_destino_id na criação, só na atualização
          // if (processoAtualizado.unidadeDestino?.id) {
          //   dataToCreate.unidade_destino_id =
          //     processoAtualizado.unidadeDestino.id;
          // } else if (
          //   typeof (processoAtualizado as any).unidadeDestino === "string" &&
          //   (processoAtualizado as any).unidadeDestino.includes(" - ")
          // ) {
          //   const sigla = (processoAtualizado as any).unidadeDestino.split(
          //     " - ",
          //   )[0];
          //   const unidade = unidades.find((u) => u.sigla === sigla);
          //   if (unidade) {
          //     dataToCreate.unidade_destino_id = unidade.id;
          //   }
          // }
          if (processoAtualizado.prazo) {
            dataToCreate.prazo = convertDateField(processoAtualizado.prazo);
          }
          if (
            exibirAtribuicaoUsuario &&
            processoAtualizado.usuario_atribuido_id
          ) {
            dataToCreate.usuario_atribuido_id =
              processoAtualizado.usuario_atribuido_id;
          }

          const response = await processoService.server.criar(dataToCreate);

          if (response.ok && response.data) {
            // Atualizar com o processo real do servidor
            const createdProcesso = response.data as IProcesso;
            if (processoAtualizado.unidadeDestino) {
              createdProcesso.unidadeDestino =
                processoAtualizado.unidadeDestino;
            }

            // Se havia unidade destino definida, fazer atualização após criação
            if (processoAtualizado.unidadeDestino?.id) {
              try {
                const updateData = {
                  unidade_destino_id: processoAtualizado.unidadeDestino.id,
                };
                const updateResponse = await processoService.server.atualizar(
                  createdProcesso.id,
                  updateData,
                );
                if (updateResponse.ok && updateResponse.data) {
                  const updatedProcesso = updateResponse.data as IProcesso;
                  if (processoAtualizado.unidadeDestino) {
                    updatedProcesso.unidadeDestino =
                      processoAtualizado.unidadeDestino;
                  }
                  // Atualizar o processo com os dados da atualização
                  Object.assign(createdProcesso, updatedProcesso);
                }
              } catch (updateError) {
                console.error(
                  "Erro ao atualizar unidade destino após criação:",
                  updateError,
                );
              }
            }

            const updatedProcessos = processosLocal.map((p) =>
              p.id === processoAtualizado.id ? createdProcesso : p,
            );
            setProcessosLocal(updatedProcessos);
            versionsRef.current.set(
              createdProcesso.id,
              new Date(createdProcesso.atualizadoEm),
            );
            toast.success("Processo criado com sucesso");
            router.refresh();
          } else {
            toast.error("Erro ao criar processo", {
              description: response.error,
            });
            event.node.setDataValue(field as string, oldValue);
          }
          return;
        } catch (error) {
          toast.error("Erro ao criar processo");
          event.node.setDataValue(field as string, oldValue);
          return;
        }
      }

      // Verificar conflito de versão (optimistic locking)
      const lastKnownVersion = versionsRef.current.get(processoAtualizado.id);
      const currentVersion = new Date(processoAtualizado.atualizadoEm);

      if (
        lastKnownVersion &&
        currentVersion.getTime() !== lastKnownVersion.getTime()
      ) {
        toast.error("Conflito detectado", {
          description:
            "Este processo foi modificado por outro usuário. Recarregue a página para ver as alterações mais recentes.",
        });
        event.node.setDataValue(field as string, oldValue);
        return;
      }

      try {
        // Validar campos obrigatórios antes de atualizar
        if (
          !processoAtualizado.numero_sei ||
          !processoAtualizado.assunto ||
          !processoAtualizado.origem
        ) {
          // Não salvar se campos obrigatórios estiverem faltando
          return;
        }

        const dataToUpdate: any = {};

        // Helper para converter data
        const convertDateField = (value: any) => {
          if (!value) return null;
          if (typeof value === "string" && value.includes("T")) {
            // Já é ISO string
            return value;
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          return new Date(value).toISOString();
        };

        // Mapear campos para os nomes corretos do backend
        if (field === "interessado") {
          let interessadoId = processoAtualizado.interessado_id;

          // Se o ID começa com 'temp-', significa que é um novo interessado
          // Precisa ser criado no backend
          if (interessadoId && interessadoId.startsWith("temp-")) {
            try {
              const novoInteressado = {
                valor: processoAtualizado.interessado,
              };

              const respostaInteressado =
                await interessadoService.server.criar(novoInteressado);

              if (respostaInteressado.ok && respostaInteressado.data) {
                // Usar o ID real do interessado criado
                interessadoId = respostaInteressado.data.id;
                // Atualizar no estado local também
                processoAtualizado.interessado_id = interessadoId;
                toast.success("Novo interessado criado");
              } else {
                toast.error("Erro ao criar interessado", {
                  description: respostaInteressado.error,
                });
                return;
              }
            } catch (error) {
              toast.error("Erro ao criar interessado");
              return;
            }
          }

          // Enviar apenas interessado_id
          dataToUpdate.interessado_id = interessadoId;
        } else if (
          field === "usuario_atribuido_nome" &&
          exibirAtribuicaoUsuario
        ) {
          dataToUpdate.usuario_atribuido_id =
            processoAtualizado.usuario_atribuido_id || null;
        } else if (field === "unidadeRemetente") {
          dataToUpdate.unidade_remetente_id =
            processoAtualizado.unidadeRemetente?.id;
        } else if (field === "unidadeDestino") {
          dataToUpdate.unidade_destino_id =
            processoAtualizado.unidadeDestino?.id;
        } else if (
          field === "data_recebimento" ||
          field === "prazo" ||
          field === "data_prorrogacao" ||
          field === "data_envio_unidade" ||
          field === "data_resposta_final"
        ) {
          dataToUpdate[field] = newValue ? convertDateField(newValue) : null;
        } else if (field === "resposta_final") {
          dataToUpdate[field] = newValue || null;
        } else {
          dataToUpdate[field as string] = newValue;
        }

        const response = await processoService.server.atualizar(
          processoAtualizado.id,
          dataToUpdate,
        );

        if (!response.ok) {
          // Rollback em caso de erro
          event.node.setDataValue(field as string, oldValue);
          toast.error("Erro ao atualizar processo", {
            description: response.error,
          });
        } else {
          // Atualizar versão após sucesso
          if (response.data) {
            const updatedProcesso = response.data as IProcesso;
            if (
              field === "unidadeDestino" &&
              processoAtualizado.unidadeDestino
            ) {
              updatedProcesso.unidadeDestino =
                processoAtualizado.unidadeDestino;
            }

            versionsRef.current.set(
              processoAtualizado.id,
              new Date(updatedProcesso.atualizadoEm),
            );

            // Atualizar o estado local com os dados do servidor
            setProcessosLocal((prevProcessos) =>
              prevProcessos.map((p) =>
                p.id === processoAtualizado.id ? updatedProcesso : p,
              ),
            );

            // Se salvou data_resposta_final, marcar todos os andamentos como CONCLUIDO
            if (field === "data_resposta_final" && newValue) {
              try {
                // Buscar andamentos do processo
                if (session?.access_token) {
                  const andamentosResponse =
                    await andamento.query.buscarPorProcesso(
                      session.access_token,
                      processoAtualizado.id,
                      session.grupoAtivo?.id,
                    );

                  if (
                    andamentosResponse.ok &&
                    andamentosResponse.data &&
                    Array.isArray(andamentosResponse.data)
                  ) {
                    // Atualizar cada andamento para status CONCLUIDO
                    const andamentosArray =
                      andamentosResponse.data as IAndamento[];
                    for (const anda of andamentosArray) {
                      if (anda.status !== "CONCLUIDO") {
                        await andamento.server.atualizar(anda.id, {
                          status: StatusAndamento.CONCLUIDO,
                        });
                      }
                    }
                    toast.success(
                      "Andamentos do processo marcados como concluídos",
                    );
                  }
                }
              } catch (error) {
                // Erro ao atualizar andamentos
              }
            }

            // Se salvou interessado_id, manter o valor interessado localmente
            if (field === "interessado" && processoAtualizado.interessado) {
              event.node.setData({
                ...processoAtualizado,
                atualizadoEm: updatedProcesso.atualizadoEm,
                interessado: processoAtualizado.interessado,
                interessado_id: processoAtualizado.interessado_id,
              });
            }
            // Se salvou unidadeDestino, manter o valor localmente
            if (
              field === "unidadeDestino" &&
              processoAtualizado.unidadeDestino
            ) {
              event.node.setData({
                ...processoAtualizado,
                atualizadoEm: updatedProcesso.atualizadoEm,
                unidadeDestino: processoAtualizado.unidadeDestino,
              });
            }
          }

          toast.success("Processo atualizado", {
            description: "As alterações foram salvas automaticamente",
          });
        }
      } catch (error) {
        // Rollback em caso de erro
        event.node.setDataValue(field as string, oldValue);
        toast.error("Erro ao atualizar processo", {
          description: "Erro ao se comunicar com o servidor",
        });
      } finally {
        // Remover da lista de salvamento
        savingRef.current.delete(saveKey);
        savingRef.current.delete(processoAtualizado.id);
      }
    },
    [
      session?.access_token,
      session?.grupoAtivo?.id,
      router,
      processosLocal,
      exibirAtribuicaoUsuario,
      unidades,
    ],
  );

  const saveColumnState = useCallback(async () => {
    // Não salvar se estamos restaurando o estado
    if (isRestoringRef.current) {
      return;
    }

    // Cancelar timer anterior se existir (debounce)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Agendar salvamento após 1 segundo sem mudanças
    saveTimerRef.current = setTimeout(async () => {
      if (gridRef.current?.api && session?.usuario) {
        const columnState = gridRef.current.api.getColumnState();
        const ordemColunas = columnState
          .map((col) => String(col.colId || "").trim())
          .filter((colId) => colId && !COLUNAS_FIXAS_UI.includes(colId));

        if (!ordemColunas.length) {
          return;
        }

        try {
          await salvarPreferencia({
            chave: chavePreferencia,
            valor: ordemColunas,
          });
        } catch (error) {
          console.error("Erro ao salvar estado das colunas:", error);
        }
      }
    }, 1000); // Debounce de 1 segundo
  }, [session?.usuario, chavePreferencia]);

  const onGridReady = useCallback(async (_params: GridReadyEvent) => {
    // A restauração agora é feita pelo useEffect que monitora a sessão
  }, []);

  const isProcessoConcluido = useCallback((processo: IProcesso) => {
    // Um processo é concluído se tem data_resposta_final ou resposta_final
    return !!processo.data_resposta_final || !!processo.resposta_final;
  }, []);

  const getRowStyle = useCallback(
    (params: any) => {
      if (!params.data || params.data._isDetail) {
        return undefined;
      }
      const processo = params.data as IProcesso;
      if (isProcessoConcluido(processo)) {
        return corDestaque("verde", isDarkModeRef.current);
      }
      return undefined;
    },
    [isProcessoConcluido],
  );

  const isFullWidthRow = useCallback((params: any) => {
    if (!params || !params.rowNode || !params.rowNode.data) {
      return false;
    }
    return params.rowNode.data._isDetail === true;
  }, []);

  const fullWidthCellRenderer = useCallback((params: ICellRendererParams) => {
    const data = params.node?.data || params.data;

    if (!data?._processo) {
      return (
        <div
          className="p-4 text-red-500"
          style={{
            backgroundColor: "#ffebee",
            minHeight: "100px",
            width: "100%",
          }}
        >
          <strong>Erro ao carregar andamentos</strong>
        </div>
      );
    }

    // Wrapper para garantir largura completa e permitir scroll
    return (
      <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
        <AndamentosDetail
          key={data._processo.id}
          processo={data._processo as IProcesso}
          unidades={unidades}
          interessados={interessadosRef.current}
        />
      </div>
    );
  }, [unidades]);

  const getRowHeight = useCallback((params: any) => {
    const data = params.node?.data || params.data;
    if (data?._isDetail) {
      // Altura dinâmica baseada no número de andamentos
      const andamentosCount = data._processo?.andamentos?.length || 0;
      const minHeight = 450; // Altura mínima para cabeçalho + tabela vazia
      const rowHeight = 45; // Altura de cada linha
      const headerHeight = 80; // Altura do cabeçalho
      const calculatedHeight = headerHeight + andamentosCount * rowHeight;
      return Math.max(calculatedHeight, minHeight);
    }
    return 42;
  }, []);

  const getRowId = useCallback((params: any) => {
    return params.data.id;
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 gap-2">
        <ExportProcessosEmLote
          selectedIds={selectedIds}
          totalSelecionados={selectedIds.length}
          busca={busca}
          interessado={interessado}
          unidade={unidade}
          vencendoHoje={vencendoHoje}
          atrasados={atrasados}
          concluidos={concluidos}
        />
        <Button
          onClick={adicionarProcesso}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          + Novo Processo
        </Button>
      </div>
      <ExpandirTudoContext.Provider
        value={{
          allExpanded: todosExpandidos,
          toggleAll: alternarExpandirTudo,
        }}
      >
        <div
          className={`ag-theme-alpine w-full ${
            theme === "dark" || (theme === "system" && systemTheme === "dark")
              ? "dark"
              : ""
          }`}
          style={
            {
              height: "600px",
              width: "100%",
              overflowX: "auto",
              overflowY: "auto",
              ...(theme === "dark" ||
              (theme === "system" && systemTheme === "dark")
                ? {
                    "--ag-background-color": "#1a1a1a",
                    "--ag-header-background-color": "#262626",
                    "--ag-header-foreground-color": "#e5e7eb",
                    "--ag-odd-row-background-color": "#1a1a1a",
                    "--ag-row-hover-color": "#2d2d2d",
                    "--ag-border-color": "#404040",
                    "--ag-foreground-color": "#e5e7eb",
                    "--ag-secondary-foreground-color": "#a3a3a3",
                    "--ag-cell-horizontal-padding": "12px",
                  }
                : {
                    "--ag-header-background-color": "#f8f9fa",
                    "--ag-header-foreground-color": "#212529",
                    "--ag-odd-row-background-color": "#ffffff",
                    "--ag-row-hover-color": "#f1f3f5",
                    "--ag-border-color": "#dee2e6",
                  }),
              fontSize: "14px",
            } as React.CSSProperties
          }
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={colunasRenderizadas}
            defaultColDef={defaultColDef}
            onCellValueChanged={onCellValueChanged}
            onGridReady={onGridReady}
            getRowId={getRowId}
            animateRows={false}
            singleClickEdit={true}
            stopEditingWhenCellsLoseFocus={true}
            onColumnMoved={saveColumnState}
            pagination={false}
            suppressPaginationPanel={true}
            suppressHorizontalScroll={false}
            rowBuffer={10}
            debounceVerticalScrollbar={true}
            theme="legacy"
            // Passar dados dinâmicos para os cell editors
            context={{
              unidades: unidades,
              interessados: interessados,
            }}
            // Configurações para linhas expansíveis (Full Width Rows)
            isFullWidthRow={isFullWidthRow}
            fullWidthCellRenderer={fullWidthCellRenderer}
            getRowHeight={getRowHeight}
            getRowStyle={getRowStyle}
            suppressCellFocus={true}
            overlayNoRowsTemplate="Nenhum processo cadastrado"
          />
        </div>
      </ExpandirTudoContext.Provider>
    </div>
  );
}
