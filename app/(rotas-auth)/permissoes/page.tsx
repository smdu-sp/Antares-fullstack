/** @format */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessState } from "../_components/access-state";
import { listarGrupos } from "@/services/acessos-admin/server-functions/grupos";
import GruposTab from "./_components/grupos-tab";
import PermissoesPapelTab from "./_components/permissoes-papel-tab";

export default async function PermissoesPage() {
  const gruposRes = await listarGrupos();

  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold mt-5 mb-5">Permissões</h1>

      <Tabs defaultValue="grupos" className="w-full">
        <TabsList>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="permissoes-papel">Permissões por Papel</TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="mt-4">
          {!gruposRes?.ok ? (
            <AccessState
              title="Não foi possível carregar os grupos"
              description={gruposRes?.error || "Erro desconhecido"}
            />
          ) : (
            <GruposTab gruposIniciais={gruposRes.data?.data ?? []} />
          )}
        </TabsContent>

        <TabsContent value="permissoes-papel" className="mt-4">
          <PermissoesPapelTab
            gruposIniciais={gruposRes?.data?.data ?? []}
            permissoesPorGrupoIniciais={gruposRes?.data?.permissoesPorGrupo ?? {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
