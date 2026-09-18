/** @format */

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import * as processo from "@/services/processos";
// unidade_remetente_id aponta pra UnidadeGrupo (por grupo), não o catálogo
// global (usado só no cadastro de usuário).
import * as unidadeGrupo from "@/services/unidades-grupo";
import { IProcesso } from "@/types/processo";
import { IUnidade } from "@/types/unidade";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProcessoDetalhesHeader, AndamentosDetalhes } from "./_components";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default async function ProcessoDetalhesPageSuspense({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ProcessoDetalhesSkeleton />}>
      <ProcessoDetalhesPage params={params} />
    </Suspense>
  );
}

async function ProcessoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.access_token) {
    redirect("/login");
  }

  if (!session.grupoAtivo?.id) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Processos
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">
                    Selecione um grupo ativo para acessar o processo
                  </p>
                  <p className="text-sm opacity-90">
                    Abra o menu do usuário e escolha um grupo ativo antes de
                    visualizar andamentos.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const response = await processo.query.buscarPorId(
    session.access_token,
    id,
    session.grupoAtivo.id,
  );

  if (!response.ok || !response.data) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Processos
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive py-8">
              <p className="text-lg font-semibold">Processo não encontrado</p>
              <p className="text-sm mt-2 text-muted-foreground">
                {response.error ||
                  "Não foi possível carregar os dados do processo"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  let processoData = response.data as any;

  // Enriquecer dados com informações das unidades
  if (processoData.interessado_id || processoData.unidade_remetente_id) {
    const unidadesResponse = await unidadeGrupo.listaCompleta(session.access_token);
    if (unidadesResponse.ok && unidadesResponse.data) {
      const unidades = unidadesResponse.data as IUnidade[];
      const unidadesMap = new Map(unidades.map((u) => [u.id, u]));

      if (processoData.interessado_id) {
        const unidadeInt = unidadesMap.get(processoData.interessado_id);
        if (unidadeInt) {
          processoData.unidadeInteressada = unidadeInt;
        }
      }

      if (processoData.unidade_remetente_id) {
        const unidadeRem = unidadesMap.get(processoData.unidade_remetente_id);
        if (unidadeRem) {
          processoData.unidadeRemetente = unidadeRem;
        }
      }
    }
  }

  processoData = processoData as IProcesso;

  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      {/* Botão Voltar */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Processos
          </Link>
        </Button>
      </div>

      {/* Cabeçalho do Processo */}
      <ProcessoDetalhesHeader processo={processoData} />

      {/* Andamentos */}
      <div className="mt-6">
        <AndamentosDetalhes processo={processoData} />
      </div>
    </div>
  );
}

function ProcessoDetalhesSkeleton() {
  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <Skeleton className="h-10 w-48 mb-6" />
      <Skeleton className="h-48 w-full mb-6" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
