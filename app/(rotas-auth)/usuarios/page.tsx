/** @format */

import DataTable, { TableSkeleton } from "@/components/data-table";
import { Filtros } from "@/components/filtros";
import Pagination from "@/components/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canAdmin } from "@/lib/access-control";
import { auth } from "@/lib/auth/auth";
import { AccessState } from "../_components/access-state";
import * as usuario from "@/services/usuarios";
import { IPaginadoUsuario, IUsuario } from "@/types/usuario";
import { Suspense } from "react";
import { columns } from "./_components/columns";
import ModalUpdateAndCreate from "./_components/modal-update-create";
import MatrizPermissoesTab from "./_components/matriz-permissoes-tab";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold mt-5 mb-5">Usuários</h1>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="matriz">Matriz de Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Suspense fallback={<TableSkeleton />}>
            <Usuarios searchParams={searchParams} />
          </Suspense>
        </TabsContent>

        <TabsContent value="matriz" className="mt-4">
          <MatrizPermissoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function Usuarios({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let { pagina = 1, limite = 10, total = 0 } = await searchParams;
  let ok = false;
  const { busca = "", status = "", dev = "" } = await searchParams;
  let dados: IUsuario[] = [];

  const session = await auth();
  if (!session?.grupoAtivo?.id) {
    return (
      <div className="my-5">
        <AccessState
          title="Selecione um grupo ativo para continuar"
          description="Abra o menu do usuário e escolha um grupo ativo antes de acessar a lista de usuários."
        />
      </div>
    );
  }

  let erro403 = false;
  if (session && session.access_token) {
    const response = await usuario.buscarTudo(
      session.access_token || "",
      +pagina,
      +limite,
      busca as string,
      status as string,
      dev as string,
      session.grupoAtivo.id,
    );
    const { data } = response;
    ok = response.ok;
    erro403 = response.status === 403;
    if (ok) {
      if (data) {
        const paginado = data as IPaginadoUsuario;
        pagina = paginado.pagina || 1;
        limite = paginado.limite || 10;
        total = paginado.total || 0;
        dados = paginado.data || [];
      }
      const paginado = data as IPaginadoUsuario;
      dados = paginado.data || [];
    }
  }

  const statusSelect = [
    {
      label: "Ativo",
      value: "ATIVO",
    },
    {
      label: "Inativo",
      value: "INATIVO",
    },
  ];

  const devSelect = [
    {
      label: "Desenvolvedor",
      value: "true",
    },
    {
      label: "Usuário",
      value: "false",
    },
  ];

  const hasAdminPermission = canAdmin(session);

  return (
    <div className="relative pb-20 md:pb-14">
      <div className="flex flex-col max-w-sm mx-auto md:max-w-full gap-3 w-full">
        {erro403 && (
          <AccessState
            title="Acesso negado para o grupo ativo"
            description="Seu grupo ativo não possui permissão para consultar usuários."
          />
        )}
        <Filtros
          camposFiltraveis={[
            {
              nome: "Busca",
              tag: "busca",
              tipo: 0,
              placeholder: "Digite o nome, email ou login",
            },
            {
              nome: "Status",
              tag: "status",
              tipo: 2,
              valores: statusSelect,
              default: "ATIVO",
            },
            {
              nome: "Permissão",
              tag: "dev",
              tipo: 2,
              valores: devSelect,
            },
          ]}
        />
        <DataTable columns={columns} data={dados || []} />

        {dados && dados.length > 0 && (
          <Pagination total={+total} pagina={+pagina} limite={+limite} />
        )}
      </div>
      {hasAdminPermission && (
        <div className="fixed z-40 bottom-10 md:bottom-5 right-2 md:right-8 hover:scale-110">
          <ModalUpdateAndCreate isUpdating={false} />
        </div>
      )}
    </div>
  );
}
