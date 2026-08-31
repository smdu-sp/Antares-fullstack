/** @format */

import DataTable, { TableSkeleton } from "@/components/data-table";
import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { auth } from "@/lib/auth/auth";
import { AccessState } from "../_components/access-state";
import * as unidade from "@/services/unidades";
import { IPaginadoUnidade, IUnidade } from "@/types/unidade";
import { Suspense } from "react";
import { columns } from "./_components/columns";
import ModalUpdateAndCreate from "./_components/modal-update-create";

export default async function UnidadesSuspense({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Unidades searchParams={searchParams} />
    </Suspense>
  );
}

async function Unidades({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let { pagina = 1, limite = 10, total = 0 } = await searchParams;
  let ok = false;
  const { busca = "" } = await searchParams;
  let dados: IUnidade[] = [];

  const session = await auth();
  const grupoAtivoId =
    session?.grupoAtivo?.id || session?.grupoAtivo?.gruposDisponiveis?.[0]?.id;

  if (!grupoAtivoId) {
    return (
      <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
        <h1 className="text-xl md:text-4xl font-bold mt-5 mb-5">Unidades</h1>
        <AccessState
          title="Selecione um grupo ativo para continuar"
          description="Abra o menu do usuário e escolha um grupo ativo antes de acessar a lista de unidades."
        />
      </div>
    );
  }

  let erro403 = false;
  if (session && session.access_token) {
    const response = await unidade.buscarTudo(
      session.access_token || "",
      +pagina,
      +limite,
      busca as string,
      grupoAtivoId,
    );
    const { data } = response;
    ok = response.ok;
    erro403 = response.status === 403;
    if (ok) {
      if (data) {
        const paginado = data as IPaginadoUnidade;
        pagina = paginado.pagina || 1;
        limite = paginado.limite || 10;
        total = paginado.total || 0;
        dados = paginado.data || [];
      }
    }
  }

  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold mt-5 mb-5">Unidades</h1>
      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-3 w-full">
        {erro403 && (
          <AccessState
            title="Acesso negado para o grupo ativo"
            description="Seu grupo ativo não possui permissão para consultar unidades."
          />
        )}
        <Filtros
          camposFiltraveis={[
            {
              nome: "Busca",
              tag: "busca",
              tipo: 0,
              placeholder: "Digite o nome ou sigla da unidade",
            },
          ]}
        />
        <DataTable columns={columns} data={dados || []} />

        {dados && dados.length > 0 && (
          <Pagination total={+total} pagina={+pagina} limite={+limite} />
        )}
      </div>
      <div className="fixed z-40 bottom-10 md:bottom-5 right-2 md:right-8 hover:scale-110">
        <ModalUpdateAndCreate isUpdating={false} />
      </div>
    </div>
  );
}
