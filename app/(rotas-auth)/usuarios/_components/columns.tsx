/** @format */

"use client";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { canAdmin, canEdit } from "@/lib/access-control";
import { IUsuario } from "@/types/usuario";
import { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import ModalDelete from "./modal-delete";
import ModalGovernancaDev from "./modal-governanca-dev";
import ModalUpdateCreate from "./modal-update-create";

const MAX_GRUPOS_VISIVEIS = 2;

function GruposCell({ grupos }: { grupos: IUsuario["grupos"] }) {
  const lista = grupos || [];

  if (lista.length === 0) {
    return <div className="text-center text-muted-foreground">-</div>;
  }

  const visiveis = lista.slice(0, MAX_GRUPOS_VISIVEIS);
  const ocultos = lista.slice(MAX_GRUPOS_VISIVEIS);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {visiveis.map(({ grupo }) => (
        <Badge key={grupo.id} variant="secondary">
          {grupo.nome}
        </Badge>
      ))}
      {ocultos.length > 0 && (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="cursor-default">
              +{ocultos.length}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto max-w-xs">
            <div className="flex flex-wrap gap-1">
              {ocultos.map(({ grupo }) => (
                <Badge key={grupo.id} variant="secondary">
                  {grupo.nome}
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}

function UserActionsCell({ user }: { user: IUsuario }) {
  const { data: session } = useSession();
  // canEdit/canAdmin precisam da sessão inteira, não só session.usuario (ver
  // mesma correção em modal-delete-processo.tsx).
  const hasEditPermission = canEdit(session);
  const hasAdminPermission = canAdmin(session);
  const isDev = session?.usuario?.dev === true;

  if (!hasEditPermission) {
    return (
      <div className="text-center text-xs text-muted-foreground">
        Somente leitura
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center justify-center">
      <ModalUpdateCreate user={user} isUpdating={true} />
      {isDev && <ModalGovernancaDev user={user} />}
      {hasAdminPermission && <ModalDelete status={!user.status} id={user.id} />}
    </div>
  );
}

export const columns: ColumnDef<IUsuario>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "login",
    header: "Usuário",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "unidade",
    header: "Unidade",
    cell: ({ row }) => {
      const unidade = row.original.unidade;
      return <div>{unidade ? `${unidade.nome} (${unidade.sigla})` : "-"}</div>;
    },
  },
  {
    accessorKey: "grupos",
    header: "Grupo",
    cell: ({ row }) => <GruposCell grupos={row.original.grupos} />,
  },
  {
    accessorKey: "status",
    header: () => <p className="text-center">Status</p>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center justify-center">
          <Badge variant={`${status == false ? "destructive" : "default"}`}>
            {status ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: () => <p className="text-center">Ações</p>,
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  },
];
