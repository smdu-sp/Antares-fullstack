#!/usr/bin/env node
// Recalcula processo.prazo_efetivo / andamentos_todos_concluidos de TODOS os
// processos com a regra atual (ver lib/server/processos/recalcular-prazo-efetivo.ts):
// prazo_efetivo = (prorrogacao ?? prazo) do andamento ativo MAIS RECENTE, ou nulo
// se ele está CONCLUIDO/sem prazo. Rodar uma vez após subir a mudança de regra —
// depois disso o app mantém sozinho a cada criar/atualizar/remover andamento.
// Idempotente: só grava os processos cujo valor de fato muda.
//
// Uso: node scripts/recalcular-prazo-efetivo.mjs [--dry-run]

import { PrismaClient } from "@prisma/client";

const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

const andamentos = await prisma.andamento.findMany({
  where: { ativo: true },
  orderBy: [{ processo_id: "asc" }, { criadoEm: "desc" }],
  select: { processo_id: true, status: true, prazo: true, prorrogacao: true },
});

// Como está ordenado por criadoEm desc dentro de cada processo, o primeiro de
// cada grupo é o mais recente.
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
  const maisRecente = lista[0];
  const prazoEfetivo =
    maisRecente && maisRecente.status !== "CONCLUIDO"
      ? (maisRecente.prorrogacao ?? maisRecente.prazo ?? null)
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
