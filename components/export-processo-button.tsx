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

export function ExportProcessoButton({ processoId }: { processoId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (
    format: 'excel' | 'pdf',
    modo: 'completo' | 'apenasProcesso' | 'apenasAndamentos'
  ) => {
    setIsLoading(true);
    try {
      const params = {
        ids: [processoId],
        incluirProcesso: modo !== 'apenasAndamentos',
        incluirAndamentos: modo !== 'apenasProcesso',
      };

      const result =
        format === 'excel'
          ? await exportService.server.exportarProcessosExcel(params)
          : await exportService.server.exportarProcessosPdf(params);

      if (result.ok && result.blob) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `processo_${processoId}_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        downloadBlob(result.blob, filename);
        if (result.aviso) {
          toast.warning(`Processo exportado para ${format.toUpperCase()}`, {
            description: result.aviso,
          });
        } else {
          toast.success(`Processo exportado para ${format.toUpperCase()}`);
        }
      } else {
        toast.error(result.error || 'Erro ao exportar processo');
      }
    } catch (error) {
      toast.error('Erro ao exportar processo');
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
          title="Exportar processo"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Exportar processo - Excel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'completo')}
          disabled={isLoading}
        >
          📊 Processo + Andamentos
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'apenasProcesso')}
          disabled={isLoading}
        >
          📋 Apenas Processo
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel', 'apenasAndamentos')}
          disabled={isLoading}
        >
          📝 Apenas Andamentos
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuLabel>Exportar processo - PDF</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'completo')}
          disabled={isLoading}
        >
          📄 Processo + Andamentos
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'apenasProcesso')}
          disabled={isLoading}
        >
          📑 Apenas Processo
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'apenasAndamentos')}
          disabled={isLoading}
        >
          📜 Apenas Andamentos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
