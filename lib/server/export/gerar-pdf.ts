import PDFDocumentModule from 'pdfkit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buscarProcessosParaExport } from './buscar-processos';
import { buscarAndamentosParaExport } from './buscar-andamentos';

// @types/pdfkit tipa o export do módulo como uma instância (`export = doc`), não como
// construtor, o que não bate com a interop do bundler do Next (o objeto importado vem
// embrulhado em `{ default, ...spread }`). O runtime real é uma classe — corrige o tipo aqui.
const PDFDocument = PDFDocumentModule as unknown as new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFKit.PDFDocument;

type Processo = Awaited<ReturnType<typeof buscarProcessosParaExport>>['data'][number];
type Andamento = Awaited<ReturnType<typeof buscarAndamentosParaExport>>['data'][number];

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/** Porte de ExportService.exportProcessosToPDF (Antares-backend/src/export/export.service.ts). */
export async function exportProcessosToPDF(
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
    return exportAndamentosToPDF(todosAndamentos as unknown as Andamento[]);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Processos', { align: 'center' });
    doc.moveDown();

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Data de Geração: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    processos.forEach((processo, index) => {
      if (index > 0) doc.addPage();
      addProcessoToPDF(doc, processo, incluirAndamentos);
    });

    doc.end();
  });
}

/** Porte de ExportService.addProcessoToPDF. */
function addProcessoToPDF(
  doc: PDFKit.PDFDocument,
  processo: Processo,
  incluirAndamentos: boolean,
) {
  doc.fontSize(14).font('Helvetica-Bold').text(`Processo: ${processo.numero_sei}`);
  doc.moveDown(0.5);

  const details = [
    { label: 'Assunto', value: processo.assunto },
    { label: 'Origem', value: processo.origem },
    { label: 'Interessado', value: processo.interessado?.valor || 'Não informado' },
    {
      label: 'Unidade Remetente',
      value: processo.unidadeRemetente
        ? `${processo.unidadeRemetente.sigla} - ${processo.unidadeRemetente.nome}`
        : 'Não informada',
    },
    {
      label: 'Unidade Destino',
      value: processo.unidadeDestino
        ? `${processo.unidadeDestino.sigla} - ${processo.unidadeDestino.nome}`
        : 'Não informada',
    },
    {
      label: 'Data Recebimento',
      value: processo.data_recebimento ? formatDate(processo.data_recebimento) : 'Não informada',
    },
    {
      label: 'Data Envio',
      value: processo.data_envio_unidade ? formatDate(processo.data_envio_unidade) : 'Não informada',
    },
    { label: 'Prazo', value: processo.prazo ? formatDate(processo.prazo) : 'Não informado' },
    {
      label: 'Prorrogação',
      value: processo.prorrogacao ? formatDate(processo.prorrogacao) : 'Não informada',
    },
    {
      label: 'Data Resposta Final',
      value: processo.data_resposta_final ? formatDate(processo.data_resposta_final) : 'Não informada',
    },
    { label: 'Resposta Final', value: processo.resposta_final || 'Não informada' },
  ];

  doc.fontSize(10).font('Helvetica');
  details.forEach((detail) => {
    doc
      .font('Helvetica-Bold')
      .text(`${detail.label}: `, { continued: true })
      .font('Helvetica')
      .text(detail.value);
  });

  if (incluirAndamentos && processo.andamentos && processo.andamentos.length > 0) {
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text('Andamentos:');
    doc.moveDown(0.5);

    processo.andamentos.forEach((andamento, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. Andamento:`);
      doc.fontSize(9).font('Helvetica');
      doc.text(`  Origem: ${andamento.origem}`);
      doc.text(`  Destino: ${andamento.destino}`);
      if (andamento.assunto) doc.text(`  Assunto: ${andamento.assunto}`);
      doc.text(`  Status: ${andamento.status}`);
      if (andamento.data_envio) doc.text(`  Data Envio: ${formatDate(andamento.data_envio)}`);
      if (andamento.prazo) doc.text(`  Prazo: ${formatDate(andamento.prazo)}`);
      if (andamento.prorrogacao) doc.text(`  Prorrogação: ${formatDate(andamento.prorrogacao)}`);
      if (andamento.resposta) doc.text(`  Resposta: ${formatDate(andamento.resposta)}`);
      if (andamento.observacao) doc.text(`  Observação: ${andamento.observacao}`);
      doc.moveDown(0.5);
    });
  }
}

/** Porte de ExportService.exportAndamentosToPDF. */
export async function exportAndamentosToPDF(andamentos: Andamento[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Andamentos', { align: 'center' });
    doc.moveDown();

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Data de Geração: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(2);

    andamentos.forEach((andamento, index) => {
      if (index > 0 && index % 3 === 0) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').text(`Andamento ${index + 1}`);
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica');
      doc
        .font('Helvetica-Bold')
        .text('Processo: ', { continued: true })
        .font('Helvetica')
        .text(andamento.processo?.numero_sei || 'Não identificado');

      doc
        .font('Helvetica-Bold')
        .text('Origem: ', { continued: true })
        .font('Helvetica')
        .text(andamento.origem);

      doc
        .font('Helvetica-Bold')
        .text('Destino: ', { continued: true })
        .font('Helvetica')
        .text(andamento.destino);

      if (andamento.assunto) {
        doc
          .font('Helvetica-Bold')
          .text('Assunto: ', { continued: true })
          .font('Helvetica')
          .text(andamento.assunto);
      }

      doc
        .font('Helvetica-Bold')
        .text('Status: ', { continued: true })
        .font('Helvetica')
        .text(andamento.status);

      if (andamento.data_envio) {
        doc
          .font('Helvetica-Bold')
          .text('Data Envio: ', { continued: true })
          .font('Helvetica')
          .text(formatDate(andamento.data_envio));
      }

      if (andamento.prazo) {
        doc
          .font('Helvetica-Bold')
          .text('Prazo: ', { continued: true })
          .font('Helvetica')
          .text(formatDate(andamento.prazo));
      }

      if (andamento.prorrogacao) {
        doc
          .font('Helvetica-Bold')
          .text('Prorrogação: ', { continued: true })
          .font('Helvetica')
          .text(formatDate(andamento.prorrogacao));
      }

      if (andamento.resposta) {
        doc
          .font('Helvetica-Bold')
          .text('Resposta: ', { continued: true })
          .font('Helvetica')
          .text(formatDate(andamento.resposta));
      }

      if (andamento.observacao) {
        doc
          .font('Helvetica-Bold')
          .text('Observação: ', { continued: true })
          .font('Helvetica')
          .text(andamento.observacao);
      }

      doc.moveDown(1.5);
    });

    doc.end();
  });
}
