import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buscarProcessosParaExport } from './buscar-processos';
import { buscarAndamentosParaExport } from './buscar-andamentos';

type Processo = Awaited<ReturnType<typeof buscarProcessosParaExport>>['data'][number];
type Andamento = Awaited<ReturnType<typeof buscarAndamentosParaExport>>['data'][number];

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/** Porte de ExportService.exportProcessosToExcel (Antares-backend/src/export/export.service.ts). */
export async function exportProcessosToExcel(
  processos: Processo[],
  incluirAndamentos: boolean = false,
  incluirProcesso: boolean = true,
): Promise<Buffer> {
  if (incluirProcesso === false) {
    const todosAndamentos = processos.flatMap((p) =>
      (p.andamentos || []).map((a) => ({
        ...a,
        processo: { numero_sei: p.numero_sei, assunto: p.assunto },
      })),
    );
    return exportAndamentosToExcel(todosAndamentos as unknown as Andamento[]);
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Processos');

  worksheet.columns = [
    { header: 'Número SEI', key: 'numero_sei', width: 20 },
    { header: 'Assunto', key: 'assunto', width: 40 },
    { header: 'Origem', key: 'origem', width: 20 },
    { header: 'Interessado', key: 'interessado', width: 30 },
    { header: 'Unidade Remetente', key: 'unidadeRemetente', width: 25 },
    { header: 'Unidade Destino', key: 'unidadeDestino', width: 25 },
    { header: 'Data Recebimento', key: 'data_recebimento', width: 18 },
    { header: 'Data Envio', key: 'data_envio_unidade', width: 18 },
    { header: 'Prazo', key: 'prazo', width: 18 },
    { header: 'Prorrogação', key: 'prorrogacao', width: 18 },
    { header: 'Data Resposta Final', key: 'data_resposta_final', width: 18 },
    { header: 'Resposta Final', key: 'resposta_final', width: 40 },
    { header: 'Criado Em', key: 'criadoEm', width: 18 },
  ];

  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  processos.forEach((processo) => {
    worksheet.addRow({
      numero_sei: processo.numero_sei,
      assunto: processo.assunto,
      origem: processo.origem,
      interessado: processo.interessado?.valor || '',
      unidadeRemetente: processo.unidadeRemetente
        ? `${processo.unidadeRemetente.sigla} - ${processo.unidadeRemetente.nome}`
        : '',
      unidadeDestino: processo.unidadeDestino
        ? `${processo.unidadeDestino.sigla} - ${processo.unidadeDestino.nome}`
        : '',
      data_recebimento: formatDate(processo.data_recebimento),
      data_envio_unidade: formatDate(processo.data_envio_unidade),
      prazo: formatDate(processo.prazo),
      prorrogacao: formatDate(processo.prorrogacao),
      data_resposta_final: formatDate(processo.data_resposta_final),
      resposta_final: processo.resposta_final || '',
      criadoEm: formatDate(processo.criadoEm),
    });

    if (incluirAndamentos && processo.andamentos && processo.andamentos.length > 0) {
      addAndamentosSheet(workbook, processo);
    }
  });

  worksheet.columns.forEach((column) => {
    if (column && column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Porte de ExportService.addAndamentosSheet. */
function addAndamentosSheet(workbook: ExcelJS.Workbook, processo: Processo) {
  const sanitizedSei = processo.numero_sei.replace(/[*?:\\/[\]]/g, '-').substring(0, 17);
  const sheetName = `Andamentos - ${sanitizedSei}`;
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = [
    { header: 'Origem', key: 'origem', width: 25 },
    { header: 'Destino', key: 'destino', width: 25 },
    { header: 'Assunto', key: 'assunto', width: 35 },
    { header: 'Data Envio', key: 'data_envio', width: 18 },
    { header: 'Prazo', key: 'prazo', width: 18 },
    { header: 'Prorrogação', key: 'prorrogacao', width: 18 },
    { header: 'Resposta', key: 'resposta', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Observação', key: 'observacao', width: 40 },
  ];

  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '70AD47' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  (processo.andamentos || []).forEach((andamento) => {
    worksheet.addRow({
      origem: andamento.origem,
      destino: andamento.destino,
      assunto: andamento.assunto || '',
      data_envio: formatDate(andamento.data_envio),
      prazo: formatDate(andamento.prazo),
      prorrogacao: formatDate(andamento.prorrogacao),
      resposta: formatDate(andamento.resposta),
      status: andamento.status,
      observacao: andamento.observacao || '',
    });
  });
}

/** Porte de ExportService.exportAndamentosToExcel. */
export async function exportAndamentosToExcel(andamentos: Andamento[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Andamentos');

  worksheet.columns = [
    { header: 'Número SEI', key: 'numero_sei', width: 20 },
    { header: 'Origem', key: 'origem', width: 25 },
    { header: 'Destino', key: 'destino', width: 25 },
    { header: 'Assunto', key: 'assunto', width: 35 },
    { header: 'Data Envio', key: 'data_envio', width: 18 },
    { header: 'Prazo', key: 'prazo', width: 18 },
    { header: 'Prorrogação', key: 'prorrogacao', width: 18 },
    { header: 'Resposta', key: 'resposta', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Observação', key: 'observacao', width: 40 },
    { header: 'Criado Em', key: 'criadoEm', width: 18 },
  ];

  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '70AD47' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

  andamentos.forEach((andamento) => {
    worksheet.addRow({
      numero_sei: andamento.processo?.numero_sei || '',
      origem: andamento.origem,
      destino: andamento.destino,
      assunto: andamento.assunto || '',
      data_envio: formatDate(andamento.data_envio),
      prazo: formatDate(andamento.prazo),
      prorrogacao: formatDate(andamento.prorrogacao),
      resposta: formatDate(andamento.resposta),
      status: andamento.status,
      observacao: andamento.observacao || '',
      criadoEm: formatDate(andamento.criadoEm),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
