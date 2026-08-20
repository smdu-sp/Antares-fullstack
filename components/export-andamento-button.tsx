/** @format */

'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as exportService from '@/services/export';
import { downloadBlob } from '@/services/export/client-functions';
import { toast } from 'sonner';

export function ExportAndamentoButton({ andamentoId }: { andamentoId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (
    format: 'excel' | 'pdf',
    modo: 'completo' | 'apenasAndamento'
  ) => {
    setIsLoading(true);
    try {
      const params = {
        ids: [andamentoId],
        incluirAndamentos: modo !== 'apenasAndamento',
      };

      const result =
        format === 'excel'
          ? await exportService.server.exportarAndamentosExcel(params)
          : await exportService.server.exportarAndamentosPdf(params);

      if (result.ok && result.blob) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `andamento_${andamentoId}_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        downloadBlob(result.blob, filename);
        if (result.aviso) {
          toast.warning(`Andamento exportado para ${format.toUpperCase()}`, {
            description: result.aviso,
          });
        } else {
          toast.success(`Andamento exportado para ${format.toUpperCase()}`);
        }
      } else {
        toast.error(result.error || 'Erro ao exportar andamento');
      }
    } catch (error) {
      toast.error('Erro ao exportar andamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="h-8 w-8 p-0"
          title="Exportar andamento"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar andamento - Excel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'completo')}
          disabled={isLoading}
        >
          📊 Andamento Completo
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'apenasAndamento')}
          disabled={isLoading}
        >
          📋 Apenas Dados
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuLabel>Exportar andamento - PDF</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'completo')}
          disabled={isLoading}
        >
          📄 Andamento Completo
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'apenasAndamento')}
          disabled={isLoading}
        >
          📑 Apenas Dados
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
