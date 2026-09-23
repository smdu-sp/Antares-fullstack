#!/usr/bin/env node
// Recalcula processo.prazo_efetivo / andamentos_todos_concluidos de TODOS os
// processos com a regra atual (ver lib/server/processos/recalcular-prazo-efetivo.ts):
// prazo_efetivo = MENOR (prorrogacao ?? prazo) entre os andamentos ativos ainda
// ABERTOS (EM_ANDAMENTO ou PRORROGADO), ou nulo se nenhum estiver aberto. Rodar
// uma vez após subir a mudança de regra — depois disso o app mantém sozinho a
// cada criar/atualizar/remover andamento.
// Idempotente: só grava os processos cujo valor de fato muda.
//
// Uso: node scripts/recalcular-prazo-efetivo.mjs [--dry-run]

import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

const andamentos = await prisma.andamento.findMany({
  where: { ativo: true },
  select: { processo_id: true, status: true, prazo: true, prorrogacao: true },
});

const porProcesso = new Map();
for (const a of andamentos) {
  if (!porProcesso.has(a.processo_id)) porProcesso.set(a.processo_id, []);
  porProcesso.get(a.processo_id).push(a);
}

const processos = await prisma.processo.findMany({
  select: { id: true, prazo_efetivo: true, andamentos_todos_concluidos: true },
});

let alterados = 0;
for (const p of processos) {
  const lista = porProcesso.get(p.id) ?? [];
  const todosConcluidos =
    lista.length > 0 && lista.every((a) => a.status === "CONCLUIDO");

  const prazosAbertos = lista
    .filter((a) => a.status === "EM_ANDAMENTO" || a.status === "PRORROGADO")
    .map((a) => a.prorrogacao ?? a.prazo)
    .filter((d) => d !== null);

  const prazoEfetivo =
    prazosAbertos.length > 0
      ? new Date(Math.min(...prazosAbertos.map((d) => d.getTime())))
      : null;

  const mudouPrazo =
    (p.prazo_efetivo?.getTime() ?? null) !== (prazoEfetivo?.getTime() ?? null);
  const mudouConcluidos = p.andamentos_todos_concluidos !== todosConcluidos;
  if (!mudouPrazo && !mudouConcluidos) continue;

  alterados++;
  if (!dryRun) {
    await prisma.processo.update({
      where: { id: p.id },
      data: { prazo_efetivo: prazoEfetivo, andamentos_todos_concluidos: todosConcluidos },
    });
  }
}

console.log(
  `${dryRun ? "[dry-run] " : ""}${alterados} de ${processos.length} processos ${
    dryRun ? "seriam atualizados" : "atualizados"
  }.`,
);
await prisma.$disconnect();
