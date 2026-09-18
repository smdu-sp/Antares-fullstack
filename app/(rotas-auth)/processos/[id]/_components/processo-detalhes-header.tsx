/** @format */

"use client";

import { IProcesso } from "@/types/processo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Clock, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ModalProcesso from "@/app/(rotas-auth)/processos/_components/modal-processo";
import ModalDeleteProcesso from "@/app/(rotas-auth)/processos/_components/modal-delete-processo";
import {
  getUltimoAndamento,
  diasRestantesDoAndamento,
  getStatusPrazo,
  formatarData,
} from "@/app/(rotas-auth)/processos/_components/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import * as processo from "@/services/processos";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProcessoDetalhesHeader({
  processo: processoProp,
}: {
  processo: IProcesso;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEditingAssunto, setIsEditingAssunto] = useState(false);
  const [novoAssunto, setNovoAssunto] = useState(processoProp.assunto);
  const [isSavingAssunto, setIsSavingAssunto] = useState(false);

  const ultimoAndamento = getUltimoAndamento(processoProp.andamentos);
  const diasRestantes = diasRestantesDoAndamento(ultimoAndamento);
  const statusPrazo =
    ultimoAndamento && diasRestantes !== null
      ? getStatusPrazo(diasRestantes, ultimoAndamento.status)
      : null;

  const Icone = statusPrazo?.icone;

  const handleSaveAssunto = async () => {
    if (!novoAssunto.trim()) {
      toast.error("O assunto não pode estar vazio");
      return;
    }

    if (novoAssunto === processoProp.assunto) {
      setIsEditingAssunto(false);
      return;
    }

    setIsSavingAssunto(true);
    try {
      const response = await processo.server.atualizar(processoProp.id, {
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
        setNovoAssunto(processoProp.assunto);
      }
    } catch (error) {
      toast.error("Erro ao atualizar assunto");
      setNovoAssunto(processoProp.assunto);
    } finally {
      setIsSavingAssunto(false);
    }
  };

  const handleCancelEdit = () => {
    setNovoAssunto(processoProp.assunto);
    setIsEditingAssunto(false);
  };

  return (
    <Card
      className={cn(
        "border-l-4",
        ultimoAndamento && diasRestantes !== null && diasRestantes < 0
          ? "border-l-red-500"
          : ultimoAndamento && diasRestantes !== null && diasRestantes <= 3
            ? "border-l-orange-500"
            : ultimoAndamento && diasRestantes !== null && diasRestantes <= 7
              ? "border-l-yellow-500"
              : "border-l-green-500",
      )}
    >
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-sm">
                  {processoProp.numero_sei}
                </Badge>
                {ultimoAndamento && statusPrazo && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-sm font-medium",
                      statusPrazo.bg,
                      statusPrazo.cor,
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {Icone && <Icone className="h-3 w-3" />}
                      {statusPrazo.texto}
                    </span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <ModalProcesso processo={processoProp} isUpdating={true} />
              <ModalDeleteProcesso id={processoProp.id} />
            </div>
          </div>

          {/* Assunto Section */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                {isEditingAssunto ? (
                  <Textarea
                    value={novoAssunto}
                    onChange={(e) => setNovoAssunto(e.target.value)}
                    placeholder="Digite o novo assunto..."
                    className="text-lg font-semibold min-h-20 resize-none"
                    autoFocus
                  />
                ) : (
                  <CardTitle className="text-2xl md:text-3xl font-bold leading-tight whitespace-pre-wrap break-words">
                    {processoProp.assunto}
                  </CardTitle>
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
              <div className="flex gap-2 justify-end">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Prazo do Processo */}
          {processoProp.prazo && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Prazo do Processo
                </p>
                <p className="text-sm font-medium">
                  {formatarData(processoProp.prazo, { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="text-sm font-medium">
                {new Date(processoProp.criadoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {ultimoAndamento && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo Atual</p>
                <p className="text-sm font-medium">
                  {ultimoAndamento.prorrogacao
                    ? formatarData(ultimoAndamento.prorrogacao, { day: "2-digit", month: "long", year: "numeric" })
                    : formatarData(ultimoAndamento.prazo, { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}

          {ultimoAndamento && diasRestantes !== null && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div
                className={cn(
                  "p-2 rounded-md",
                  diasRestantes < 0
                    ? "bg-red-100 dark:bg-red-900/30"
                    : diasRestantes <= 3
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-green-100 dark:bg-green-900/30",
                )}
              >
                <Clock
                  className={cn(
                    "h-5 w-5",
                    diasRestantes < 0
                      ? "text-red-600 dark:text-red-400"
                      : diasRestantes <= 3
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-green-600 dark:text-green-400",
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status do Prazo</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    diasRestantes < 0
                      ? "text-red-600 dark:text-red-400"
                      : diasRestantes <= 3
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-green-600 dark:text-green-400",
                  )}
                >
                  {diasRestantes < 0
                    ? `Atrasado ${Math.abs(diasRestantes)} dias`
                    : diasRestantes === 0
                      ? "Vence hoje"
                      : `${diasRestantes} dias restantes`}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
