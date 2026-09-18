/** @format */

import { IAndamento, StatusAndamento } from '@/types/processo';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Converte uma data UTC (como as vindas do banco) para Date local usando os componentes UTC,
// evitando o shift de timezone que faz datas aparecerem um dia antes no fuso UTC-3.
export function parseUTCDate(dateStr: Date | string | null | undefined): Date | null {
	if (!dateStr) return null;
	const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
	if (isNaN(d.getTime())) return null;
	return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Formata uma data de campo date-only (prazo, prorrogacao, etc.) em pt-BR sem shift de timezone.
export function formatarData(
	dateStr: Date | string | null | undefined,
	options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
	const d = parseUTCDate(dateStr);
	if (!d) return '-';
	return d.toLocaleDateString('pt-BR', options);
}

// Função para calcular dias restantes (considera apenas a data, sem hora)
export function calcularDiasRestantes(
	prazo: Date | string | null | undefined,
	prorrogacao?: Date | string | null,
): number {
	const raw = prorrogacao ? prorrogacao : prazo;
	// Usa componentes UTC para evitar shift de timezone em campos date-only vindos do banco
	const dataLimite = parseUTCDate(raw)!;
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	const diffTime = dataLimite.getTime() - hoje.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
}

// Função para obter status do prazo
export function getStatusPrazo(
	dias: number,
	status: StatusAndamento,
): {
	cor: string;
	bg: string;
	icone: LucideIcon;
	texto: string;
} {
	if (status === StatusAndamento.CONCLUIDO) {
		return {
			cor: 'text-green-600 dark:text-green-400',
			bg: 'bg-green-100 dark:bg-green-900/30',
			icone: CheckCircle2,
			texto: 'Concluído',
		};
	}
	if (dias < 0) {
		return {
			cor: 'text-red-600 dark:text-red-400',
			bg: 'bg-red-100 dark:bg-red-900/30',
			icone: AlertCircle,
			texto: `${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''} em atraso`,
		};
	}
	if (dias <= 3) {
		return {
			cor: 'text-orange-600 dark:text-orange-400',
			bg: 'bg-orange-100 dark:bg-orange-900/30',
			icone: Clock,
			texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
		};
	}
	return {
		cor: 'text-blue-600 dark:text-blue-400',
		bg: 'bg-blue-100 dark:bg-blue-900/30',
		icone: Clock,
		texto: `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`,
	};
}

// Andamento em evidência do processo: o MAIS RECENTE (por data de criação),
// independente do status. Antes era o "mais crítico" (o mais atrasado), o que
// na prática fazia o andamento mais antigo ficar sempre em destaque.
export function getUltimoAndamento(
	andamentos?: IAndamento[],
): IAndamento | null {
	if (!andamentos || andamentos.length === 0) return null;

	return andamentos.reduce((maisRecente, atual) =>
		new Date(atual.criadoEm).getTime() > new Date(maisRecente.criadoEm).getTime()
			? atual
			: maisRecente,
	);
}

// Dias restantes do andamento em evidência, ou null se ele não tem prazo
// nem prorrogação (prazo é opcional — new Date(null) viraria 1970 e o
// andamento apareceria com ~20 mil dias "em atraso").
export function diasRestantesDoAndamento(andamento: IAndamento | null): number | null {
	if (!andamento || (!andamento.prazo && !andamento.prorrogacao)) return null;
	return calcularDiasRestantes(andamento.prazo, andamento.prorrogacao);
}

