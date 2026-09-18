/** @format */

"use client";

import { IProcesso } from "@/types/processo";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import ModalAndamento from "./modal-andamento";
import { TableRow, TableCell } from "@/components/ui/table";
import ModalProcesso from "./modal-processo";
import ModalDeleteProcesso from "./modal-delete-processo";
import {
  getUltimoAndamento,
  diasRestantesDoAndamento,
  getStatusPrazo,
  formatarData,
} from "./utils";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProcessoRow({ processo }: { processo: IProcesso }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const refreshAndamentosRef = useRef<(() => void) | null>(null);

  const ultimoAndamento = getUltimoAndamento(processo.andamentos);
  const diasRestantes = diasRestantesDoAndamento(ultimoAndamento);
  const statusPrazo =
    ultimoAndamento && diasRestantes !== null
      ? getStatusPrazo(diasRestantes, ultimoAndamento.status)
      : null;

  return (
    <>
      <TableRow>
        <TableCell className="w-12">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>{processo.numero_sei}</TableCell>
        <TableCell>{processo.assunto}</TableCell>
        <TableCell>
          {ultimoAndamento ? (
            <div className="space-y-1">
              <div>{formatarData(ultimoAndamento.prazo)}</div>
              {ultimoAndamento.prorrogacao && (
                <div className="text-xs text-muted-foreground">
                  Prorrogação: {formatarData(ultimoAndamento.prorrogacao)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Sem andamento</span>
          )}
        </TableCell>
        <TableCell>
          {ultimoAndamento && statusPrazo && diasRestantes !== null ? (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit",
                statusPrazo.bg,
                statusPrazo.cor,
              )}
            >
              {statusPrazo.icone && <statusPrazo.icone className="h-3 w-3" />}
              <span>{statusPrazo.texto}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex gap-2 items-center justify-center">
            <ModalProcesso processo={processo} isUpdating={true} />
            <ModalDeleteProcesso id={processo.id} />
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0 bg-muted/50">
            <div className="w-full">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    Andamentos ({processo.andamentos?.length || 0})
                  </h3>
                  <ModalAndamento
                    processoId={processo.id}
                    processoOrigem={processo.origem || ""}
                    onSuccess={() => {
                      refreshAndamentosRef.current?.();
                    }}
                  />
                </div>
              </div>

              {/* Tabela de Andamentos com ScrollArea */}
              {processo.andamentos && processo.andamentos.length > 0 ? (
                <ScrollArea className="w-full h-96 border-t">
                  <div className="w-full">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold w-32">
                            Origem
                          </th>
                          <th className="text-left p-3 font-semibold w-32">
                            Destino
                          </th>
                          <th className="text-left p-3 font-semibold w-28">
                            Status
                          </th>
                          <th className="text-left p-3 font-semibold w-28">
                            Prazo
                          </th>
                          <th className="text-left p-3 font-semibold">
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {processo.andamentos.map((andamento, idx) => (
                          <tr
                            key={andamento.id}
                            className={cn(
                              "border-b hover:bg-blue-50/50 transition-colors",
                              idx % 2 === 0 ? "bg-white" : "bg-blue-50/30",
                            )}
                          >
                            <td className="p-3 text-xs">
                              <span className="font-medium">
                                {andamento.origem}
                              </span>
                            </td>
                            <td className="p-3 text-xs">
                              <span className="font-medium">
                                {andamento.destino}
                              </span>
                            </td>
                            <td className="p-3 text-xs">
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-sm font-medium">
                                {andamento.status}
                              </span>
                            </td>
                            <td className="p-3 text-xs">
                              {andamento.prazo ? formatarData(andamento.prazo) : "-"}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                              {andamento.observacao || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8 border-t">
                  Nenhum andamento registrado
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
