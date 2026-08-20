/** @format */

'use client';

import { useState } from 'react';
import { FileDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as exportService from '@/services/export';
import type { ExportParams } from '@/services/export';
import { downloadBlob } from '@/services/export/client-functions';
import { toast } from 'sonner';

interface ExportProcessosEmLoteProps {
  selectedIds?: string[];
  totalSelecionados?: number;
  busca?: string;
  interessado?: string;
  unidade?: string;
  vencendoHoje?: boolean;
  atrasados?: boolean;
  concluidos?: boolean;
  incluirAndamentos?: boolean;
  onClearSelection?: () => void;
}

export function ExportProcessosEmLote({
  selectedIds = [],
  totalSelecionados = 0,
  busca = '',
  interessado = '',
  unidade = '',
  vencendoHoje = false,
  atrasados = false,
  concluidos = false,
  incluirAndamentos: initialIncluirAndamentos = false,
  onClearSelection,
}: ExportProcessosEmLoteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [incluirAndamentos, setIncluirAndamentos] = useState(initialIncluirAndamentos);

  const handleExport = async (format: 'excel' | 'pdf', incluirFiltrados: boolean) => {
    setIsLoading(true);
    try {
      const params: ExportParams = incluirFiltrados
        ? {
            busca: busca || undefined,
            interessado: interessado || undefined,
            unidade: unidade || undefined,
            vencendoHoje: vencendoHoje || undefined,
            atrasados: atrasados || undefined,
            concluidos: concluidos || undefined,
            incluirAndamentos: incluirAndamentos ? true : undefined,
          }
        : {
            ids: selectedIds.length > 0 ? selectedIds : undefined,
            incluirAndamentos: incluirAndamentos ? true : undefined,
          };

      const result =
        format === 'excel'
          ? await exportService.server.exportarProcessosExcel(params)
          : await exportService.server.exportarProcessosPdf(params);

      if (result.ok && result.blob) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `processos_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        downloadBlob(result.blob, filename);
        if (result.aviso) {
          toast.warning(`Processos exportados para ${format.toUpperCase()}`, {
            description: result.aviso,
          });
        } else {
          toast.success(`Processos exportados para ${format.toUpperCase()}`);
        }
      } else {
        toast.error(result.error || 'Erro ao exportar processos');
      }
    } catch (error) {
      toast.error('Erro ao exportar processos');
    } finally {
      setIsLoading(false);
    }
  };

  const temSelecao = selectedIds.length > 0 || totalSelecionados > 0;
  const temFiltros = busca || interessado || unidade || vencendoHoje || atrasados || concluidos;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || (!temSelecao && !temFiltros)}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          Exportar
          {temSelecao && totalSelecionados > 0 && (
            <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {totalSelecionados}
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar processos</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {temSelecao && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Selecionados ({totalSelecionados})
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport('excel', false)} disabled={isLoading}>
              📊 Excel (selecionados)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf', false)} disabled={isLoading}>
              📄 PDF (selecionados)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {temFiltros && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Com filtros aplicados
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport('excel', true)} disabled={isLoading}>
              📊 Excel (filtrados)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf', true)} disabled={isLoading}>
              📄 PDF (filtrados)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuCheckboxItem
          checked={incluirAndamentos}
          onCheckedChange={setIncluirAndamentos}
          className="text-xs"
        >
          ✓ Incluir andamentos
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
