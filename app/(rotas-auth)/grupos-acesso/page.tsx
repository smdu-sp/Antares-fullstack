/** @format */

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarGrupos } from "@/services/acessos-admin/server-functions/grupos";
import GruposTab from "./_components/grupos-tab";
import VincularProcessoTab from "./_components/vincular-processo-tab";
import MatrizPermissoesTab from "./_components/matriz-permissoes-tab";
import { AccessState } from "../_components/access-state";

export default async function GruposAcessoPage() {
  const session = await auth();

  if (!session?.access_token) {
    redirect("/login");
  }

  if (session.usuario?.permissao !== "DEV") {
    redirect("/");
  }

  const gruposRes = await listarGrupos();

  return (
    <div className="w-full px-0 md:px-8 pb-20 md:pb-14 h-full md:container mx-auto">
      <h1 className="text-xl md:text-4xl font-bold mb-5">Grupos de Acesso</h1>

      {!gruposRes.ok ? (
        <AccessState
          title="Não foi possível carregar os grupos"
          description={gruposRes.error || "Erro desconhecido"}
        />
      ) : (
        <Tabs defaultValue="grupos" className="w-full">
          <TabsList>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="vincular-processo">Vincular Processo</TabsTrigger>
            <TabsTrigger value="matriz">Matriz de Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="grupos" className="mt-4">
            <GruposTab gruposIniciais={gruposRes.data?.data ?? []} />
          </TabsContent>

          <TabsContent value="vincular-processo" className="mt-4">
            <VincularProcessoTab gruposDisponiveis={gruposRes.data?.data ?? []} />
          </TabsContent>

          <TabsContent value="matriz" className="mt-4">
            <MatrizPermissoesTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
