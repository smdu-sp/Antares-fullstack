/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import { IAndamento, IProcesso, StatusAndamento } from "@/types/processo";
import * as andamento from "@/services/andamentos";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  User,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAdmin, canEdit } from "@/lib/access-control";
import {
  calcularDiasRestantes,
  getStatusPrazo,
  formatarData,
} from "@/app/(rotas-auth)/processos/_components/utils";
import ModalAndamento from "@/app/(rotas-auth)/processos/_components/modal-andamento";
import ModalRespostaFinal from "@/app/(rotas-auth)/processos/_components/modal-resposta-final";
import ModalEditAndamento from "@/app/(rotas-auth)/processos/_components/modal-edit-andamento";
import ModalDeleteAndamento from "@/app/(rotas-auth)/processos/_components/modal-delete-andamento";
import ModalAdicionarObservacao from "@/app/(rotas-auth)/processos/_components/modal-adicionar-observacao";
import ModalEditObservacao from "@/app/(rotas-auth)/processos/_components/modal-edit-observacao";
import ModalProrrogarAndamento from "@/app/(rotas-auth)/processos/_components/modal-prorrogar-andamento";
import ModalResponderAndamento from "@/app/(rotas-auth)/processos/_components/modal-responder-andamento";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateInput from "@/components/ui/date-input";
import { ptBR } from "date-fns/locale";

export default function AndamentosDetalhes({
  processo,
}: {
  processo: IProcesso;
}) {
  const { data: session } = useSession();
  // canEdit/canAdmin precisam da sessão inteira (usam session.grupoAtivo.membroAtivo.
  // permissao pra refletir o papel real do grupo ativo) — passar só session.usuario
  // faz cair sempre no fallback de DEV, escondendo edição/exclusão pra qualquer
  // ADM/TEC real de grupo que não seja também DEV.
  const hasEditPermission = canEdit(session);
  const hasAdminPermission = canAdmin(session);
  const [andamentos, setAndamentos] = useState<IAndamento[]>(
    processo.andamentos || [],
  );
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [selectedAndamentos, setSelectedAndamentos] = useState<Set<string>>(
    new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProrrogarDialog, setShowProrrogarDialog] = useState(false);
  const [dataProrrogacao, setDataProrrogacao] = useState<Date | null>(null);

  const fetchAndamentos = useCallback(async () => {
    if (session?.access_token) {
      setLoading(true);
      const response = await andamento.query.buscarPorProcesso(
        session.access_token as string,
        processo.id,
        session.grupoAtivo?.id,
      );
      if (response.ok && response.data) {
        setAndamentos(response.data as IAndamento[]);
      }
      setLoading(false);
    }
  }, [session?.access_token, session?.grupoAtivo?.id, processo.id]);

  useEffect(() => {
    if (session && refreshKey > 0) {
      fetchAndamentos();
    }
  }, [session, fetchAndamentos, refreshKey]);

  const refreshFn = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Funções para seleção múltipla
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAndamentos(new Set());
  };

  const toggleAndamentoSelection = (andamentoId: string) => {
    const newSelected = new Set(selectedAndamentos);
    if (newSelected.has(andamentoId)) {
      newSelected.delete(andamentoId);
    } else {
      newSelected.add(andamentoId);
    }
    setSelectedAndamentos(newSelected);
  };

  const selectAllAndamentos = () => {
    if (selectedAndamentos.size === andamentosOrdenados.length) {
      setSelectedAndamentos(new Set());
    } else {
      const newSet = new Set(andamentosOrdenados.map((a) => a.id));
      setSelectedAndamentos(newSet);
    }
  };

  const clearSelection = () => {
    setSelectedAndamentos(new Set());
  };

  // Função para edição em lote
  const handleBulkEdit = async (action: string, value?: any) => {
    if (selectedAndamentos.size === 0) return;

    if (action === "delete") {
      // Por enquanto, excluir sem confirmação para testar
      const ids = Array.from(selectedAndamentos);
      for (const id of ids) {
        await andamento.server.remover(id);
      }
      clearSelection();
      setIsSelectionMode(false);
      refreshFn();
      return;
    }

    try {
      const ids = Array.from(selectedAndamentos);

      // Filtrar apenas IDs válidos (strings não vazias)
      const validIds = ids.filter(
        (id) => typeof id === "string" && id.trim() !== "" && id !== "lote",
      );

      if (validIds.length === 0) {
        return;
      }

      let data: { ids: string[]; operacao: string; prazo?: string };

      if (action === "status") {
        // Verificar se é um objeto com status e prazo (prorrogação)
        if (typeof value === "object" && value.status) {
          const operacao =
            value.status === StatusAndamento.CONCLUIDO
              ? "concluir"
              : "prorrogar";
          data = { ids: validIds, operacao };

          // Adicionar prazo se for prorrogação
          if (operacao === "prorrogar" && value.prazo) {
            data.prazo = value.prazo;
          }
        } else {
          // Mapear status direto para operação (usado em concluir)
          const operacao =
            value === StatusAndamento.CONCLUIDO ? "concluir" : "prorrogar";
          data = { ids: validIds, operacao };
        }
      } else {
        // Para outros casos, pode ser necessário ajustar
        data = { ids: validIds, operacao: action };
      }

      const response = await andamento.server.atualizarLote(data);

      if (response.ok) {
        clearSelection();
        setIsSelectionMode(false);
        refreshFn();
      } else {
        console.error("O backend está retornando erro 404 com a mensagem:");
        console.error(`'${response.error}'`);
        console.error(
          "Isso indica que o backend está iterando sobre as propriedades do objeto",
        );
        console.error("em vez dos valores do array 'ids'.");
        console.error(
          "O backend precisa ser corrigido para usar: for (const id of data.ids)",
        );
        console.error("=============================");
      }
    } catch (error) {
      console.error("Erro na edição em lote:", error);
    }
  };

  // Ordena andamentos por data de criação (mais recente primeiro)
  const andamentosOrdenados = [...andamentos].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  );

  // (Removed temporary global event listeners and debug logs)

  // Separa andamentos em ativos (tudo exceto CONCLUIDO) e histórico (apenas CONCLUIDO)
  // Observação: PRORROGADO deve permanecer entre os andamentos ativos
  const andamentosHistorico = andamentosOrdenados.filter(
    (a) => a.status === StatusAndamento.CONCLUIDO,
  );
  const andamentosEmAndamento = andamentosOrdenados.filter(
    (a) => a.status !== StatusAndamento.CONCLUIDO,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Botões de Criar Andamento e Resposta Final */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">Andamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe a tramitação do processo
          </p>
        </div>
        <div className="flex gap-2">
          {hasEditPermission && (
            <ModalAndamento
              processoId={processo.id}
              processoOrigem={processo.origem || ""}
              onSuccess={refreshFn}
              size="lg"
              variant="default"
            />
          )}
          {hasEditPermission && andamentosOrdenados.length > 0 && (
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="lg"
              onClick={toggleSelectionMode}
              className="flex items-center gap-2"
            >
              {isSelectionMode ? (
                <CheckSquare className="h-5 w-5 mr-2" />
              ) : (
                <Square className="h-5 w-5 mr-2" />
              )}
              {isSelectionMode ? "Sair do modo seleção" : "Editar em lote"}
            </Button>
          )}
          {hasEditPermission && (
            <ModalRespostaFinal
              processo={processo}
              onSuccess={refreshFn}
              size="lg"
              variant="outline"
            />
          )}
        </div>
      </div>

      {/* Barra de ações em lote */}
      {hasEditPermission && isSelectionMode && (
        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllAndamentos}
              disabled={andamentosOrdenados.length === 0}
            >
              {selectedAndamentos.size === andamentosOrdenados.length
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedAndamentos.size} de {andamentosOrdenados.length}{" "}
              selecionados
            </span>
          </div>

          {selectedAndamentos.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleBulkEdit("status", StatusAndamento.CONCLUIDO)
                }
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar como Concluído
              </Button>

              <Dialog
                open={showProrrogarDialog}
                onOpenChange={setShowProrrogarDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Marcar como Prorrogado
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Prorrogar Andamentos</DialogTitle>
                    <DialogDescription>
                      Informe a nova data de prazo para os{" "}
                      {selectedAndamentos.size} andamento(s) selecionado(s).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dataProrrogacao">
                        Nova Data de Prazo
                      </Label>
                      <DateInput
                        value={dataProrrogacao}
                        onChange={(d) => setDataProrrogacao(d ?? null)}
                        placeholder="DD/MM/AAAA"
                        calendarProps={{ locale: ptBR }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProrrogarDialog(false);
                        setDataProrrogacao(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        if (dataProrrogacao) {
                          // Converter Date para ISO string
                          const dataISO = dataProrrogacao.toISOString();

                          handleBulkEdit("status", {
                            status: StatusAndamento.PRORROGADO,
                            prazo: dataISO,
                          });
                          setShowProrrogarDialog(false);
                          setDataProrrogacao(null);
                        }
                      }}
                      disabled={!dataProrrogacao}
                    >
                      Confirmar Prorrogação
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasAdminPermission && (
                <AlertDialog
                  open={showDeleteConfirm}
                  onOpenChange={setShowDeleteConfirm}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir Selecionados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir {selectedAndamentos.size}{" "}
                        andamento(s) selecionado(s)? Esta ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleBulkEdit("delete");
                          setShowDeleteConfirm(false);
                        }}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      )}

      {/* Andamentos em Andamento */}
      {andamentosEmAndamento.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {andamentosEmAndamento.length === 1
              ? "Andamento Atual"
              : `Andamentos em Andamento (${andamentosEmAndamento.length})`}
          </h3>
          <ScrollArea
            className={andamentosEmAndamento.length > 3 ? "h-96" : ""}
          >
            <div className="space-y-4 pr-4">
              {andamentosEmAndamento.map((andamento) => (
                <Card
                  key={andamento.id}
                  className="border-l-4 border-l-blue-500"
                >
                  {/* Checkbox para seleção múltipla */}
                  {hasEditPermission && isSelectionMode && (
                    <div className="p-4 pb-0">
                      <Checkbox
                        checked={selectedAndamentos.has(andamento.id)}
                        onCheckedChange={() =>
                          toggleAndamentoSelection(andamento.id)
                        }
                        className="mb-2"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {andamento.origem} → {andamento.destino}
                        </CardTitle>
                        <CardDescription>
                          Processo em tramitação
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {hasEditPermission && (
                          <>
                            <ModalAdicionarObservacao
                              processoId={processo.id}
                              onSuccess={refreshFn}
                            />
                            <ModalProrrogarAndamento
                              andamento={andamento}
                              onSuccess={refreshFn}
                            />
                            <ModalResponderAndamento
                              andamento={andamento}
                              processoId={processo.id}
                              onSuccess={refreshFn}
                            />
                            <ModalEditAndamento
                              andamento={andamento}
                              onSuccess={refreshFn}
                            />
                          </>
                        )}
                        {hasAdminPermission && (
                          <ModalDeleteAndamento
                            andamento={andamento}
                            onSuccess={refreshFn}
                          />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AndamentoCard
                      andamento={andamento}
                      processoId={processo.id}
                      onRefresh={refreshFn}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Histórico de Andamentos - Collapsible */}
      {andamentosHistorico.length > 0 && (
        <Collapsible
          open={historicoAberto}
          onOpenChange={setHistoricoAberto}
          className="space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-between h-12 text-base"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">
                  Histórico de Andamentos ({andamentosHistorico.length})
                </span>
              </div>
              {historicoAberto ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origem → Destino</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {andamentosHistorico.map((and) => (
                      <AndamentoRow
                        key={and.id}
                        andamento={and}
                        processoId={processo.id}
                        onRefresh={refreshFn}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedAndamentos.has(and.id)}
                        onToggleSelection={() =>
                          toggleAndamentoSelection(and.id)
                        }
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Mensagem quando não há andamentos */}
      {andamentosEmAndamento.length === 0 &&
        andamentosHistorico.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base">
                  Nenhum andamento cadastrado para este processo.
                </p>
                <p className="text-sm mt-2">
                  Clique no botão acima para adicionar o primeiro andamento.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

// Componente para Card de Andamento Detalhado
function AndamentoCard({
  andamento,
  processoId,
  onRefresh,
}: {
  andamento: IAndamento;
  processoId: string;
  onRefresh: () => void;
}) {
  const diasRestantes = calcularDiasRestantes(
    new Date(andamento.prazo),
    andamento.prorrogacao,
  );
  const statusPrazo = getStatusPrazo(diasRestantes, andamento.status);
  const Icone = statusPrazo.icone;

  return (
    <div className="space-y-4">
      {/* Status e Prazo */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant={
            andamento.status === StatusAndamento.PRORROGADO
              ? "secondary"
              : "outline"
          }
        >
          {andamento.status === StatusAndamento.EM_ANDAMENTO
            ? "Em Andamento"
            : andamento.status === StatusAndamento.PRORROGADO
              ? "Prorrogado"
              : "Concluído"}
        </Badge>
        {andamento.status !== StatusAndamento.CONCLUIDO && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium",
              statusPrazo.bg,
              statusPrazo.cor,
            )}
          >
            <Icone className="h-4 w-4" />
            <span>{statusPrazo.texto}</span>
          </div>
        )}
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Origem</p>
            <p className="text-base font-medium">{andamento.origem}</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Destino</p>
            <p className="text-base font-medium">{andamento.destino}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Prazo Original</p>
              <p className="text-base font-medium">
                {formatarData(andamento.prazo, { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          {andamento.usuario && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="text-base font-medium">
                  {andamento.usuario.nomeSocial || andamento.usuario.nome}
                </p>
              </div>
            </div>
          )}
          {andamento.prorrogacao && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Prazo Prorrogado
                </p>
                <p className="text-base font-medium text-orange-600 dark:text-orange-400">
                  {formatarData(andamento.prorrogacao, { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                {andamento.usuarioProrrogacao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    por{" "}
                    {andamento.usuarioProrrogacao.nomeSocial ||
                      andamento.usuarioProrrogacao.nome}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Observações */}
      {andamento.observacao && (
        <ObservacoesSection
          observacao={andamento.observacao}
          andamentoId={andamento.id}
          processoId={processoId}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

// Componente para linha da tabela de andamentos históricos
function AndamentoRow({
  andamento,
  processoId,
  onRefresh,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
}: {
  andamento: IAndamento;
  processoId: string;
  onRefresh: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) {
  const { data: session } = useSession();
  // canEdit/canAdmin precisam da sessão inteira (usam session.grupoAtivo.membroAtivo.
  // permissao pra refletir o papel real do grupo ativo) — passar só session.usuario
  // faz cair sempre no fallback de DEV, escondendo edição/exclusão pra qualquer
  // ADM/TEC real de grupo que não seja também DEV.
  const hasEditPermission = canEdit(session);
  const hasAdminPermission = canAdmin(session);
  const [isExpanded, setIsExpanded] = useState(false);

  // Função para obter o estilo do badge baseado no status
  const getStatusBadge = (status: StatusAndamento) => {
    switch (status) {
      case StatusAndamento.CONCLUIDO:
        return {
          label: "Concluído",
          className:
            "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300",
        };
      case StatusAndamento.PRORROGADO:
        return {
          label: "Prorrogado",
          className:
            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300",
        };
      case StatusAndamento.EM_ANDAMENTO:
        return {
          label: "Em Andamento",
          className:
            "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300",
        };
      default:
        return {
          label: "Desconhecido",
          className:
            "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300",
        };
    }
  };

  const statusBadge = getStatusBadge(andamento.status);

  // Calcular cor da linha baseado no prazo do andamento
  const getRowColor = () => {
    // Se concluído, sempre verde claro
    if (andamento.status === StatusAndamento.CONCLUIDO) {
      return "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30";
    }

    // Se em andamento, verifica o prazo
    const diasRestantes = calcularDiasRestantes(
      new Date(andamento.prazo),
      andamento.prorrogacao,
    );

    if (diasRestantes !== null) {
      if (diasRestantes < 0)
        return "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"; // Atrasado
      if (diasRestantes === 0)
        return "bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30"; // Vencendo hoje
      if (diasRestantes <= 7)
        return "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30"; // Próximo do prazo
    }

    return "hover:bg-muted/50"; // Em andamento (padrão)
  };

  return (
    <>
      <TableRow className={cn("transition-colors", getRowColor())}>
        <TableCell className="w-12">
          {isSelectionMode ? (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
            />
          ) : (
            andamento.observacao && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )
          )}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <span>{andamento.origem}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span>{andamento.destino}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm">
          {formatarData(andamento.prazo)}
        </TableCell>
        <TableCell className="text-sm">
          {andamento.conclusao ? formatarData(andamento.conclusao) : "-"}
        </TableCell>
        <TableCell className="text-sm">
          {andamento.usuario?.nomeSocial || andamento.usuario?.nome || "-"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-1 justify-end">
            {hasEditPermission && (
              <ModalEditAndamento andamento={andamento} onSuccess={onRefresh} />
            )}
            {hasAdminPermission && (
              <ModalDeleteAndamento
                andamento={andamento}
                onSuccess={onRefresh}
              />
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && andamento.observacao && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30">
            <ObservacoesSection
              observacao={andamento.observacao}
              andamentoId={andamento.id}
              processoId={processoId}
              onRefresh={onRefresh}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Componente para seção de observações
function ObservacoesSection({
  observacao,
  andamentoId,
  processoId,
  onRefresh,
}: {
  observacao: string;
  andamentoId: string;
  processoId: string;
  onRefresh: () => void;
}) {
  const parsearObservacao = (obs: string) => {
    const obsTrimmed = obs.trim();
    if (!obsTrimmed) return null;

    const match = obsTrimmed.match(/^\[([^\]]+)\]\s+([^:]+):\s*([\s\S]*)$/);
    if (match && match.length >= 4) {
      const dataHora = match[1]?.trim();
      const autor = match[2]?.trim();
      const texto = match[3]?.trim() || "";

      if (dataHora && autor) {
        return { dataHora, autor, texto };
      }
    }

    return null;
  };

  const observacoes = observacao
    .split(/\n\s*---\s*\n/)
    .filter((obs) => obs.trim().length > 0)
    .reverse();

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg font-bold">Observações</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Lista de observações */}
        <div className="space-y-4">
          {observacoes.map((obs, idx) => {
            const parsed = parsearObservacao(obs);
            const totalObservacoes = observacoes.length;
            const indiceOriginal = totalObservacoes - 1 - idx;

            if (parsed) {
              return (
                <div
                  key={idx}
                  className="bg-muted/20 p-4 rounded-lg space-y-3 border border-border hover:border-muted-foreground/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/** Destacar respostas (autor contendo 'resposta') */}
                    {(() => {
                      const isResposta =
                        parsed.autor &&
                        parsed.autor.toLowerCase().includes("resposta");
                      const authorClass = isResposta
                        ? "flex items-center gap-3 text-sm font-semibold text-green-700 dark:text-green-400"
                        : "flex items-center gap-3 text-sm text-muted-foreground";
                      return (
                        <>
                          <div className={authorClass}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{parsed.autor}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{parsed.dataHora}</span>
                            </div>
                          </div>
                          <ModalEditObservacao
                            processoId={processoId}
                            andamentoId={andamentoId}
                            observacaoOriginal={obs}
                            indiceObservacao={indiceOriginal}
                            onSuccess={onRefresh}
                          />
                        </>
                      );
                    })()}
                  </div>
                  {parsed.texto && (
                    <div
                      className={
                        parsed.autor &&
                        parsed.autor.toLowerCase().includes("resposta")
                          ? "bg-green-50 dark:bg-green-900/20 p-4 rounded-md"
                          : "bg-muted/30 p-4 rounded-md"
                      }
                    >
                      <p
                        className={
                          parsed.autor &&
                          parsed.autor.toLowerCase().includes("resposta")
                            ? "text-sm text-green-700 dark:text-green-400 leading-relaxed whitespace-pre-wrap"
                            : "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                        }
                      >
                        {parsed.texto}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="bg-muted/20 p-4 rounded-lg border border-border hover:border-muted-foreground/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-muted/30 p-4 rounded-md flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {obs.trim()}
                    </p>
                  </div>
                  <ModalEditObservacao
                    processoId={processoId}
                    andamentoId={andamentoId}
                    observacaoOriginal={obs}
                    indiceObservacao={indiceOriginal}
                    onSuccess={onRefresh}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
