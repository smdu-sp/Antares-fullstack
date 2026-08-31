/** @format */

import {
  ChevronRight,
  House,
  LucideProps,
  Users,
  FileText,
  Building2,
  UserCircle,
  KeyRound,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import Link from "../link";

export async function NavMain() {
  const session = await auth();
  const usuario = session?.usuario;
  const isDev = usuario?.dev === true;
  interface IMenu {
    icone: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
    titulo: string;
    url?: string;
    permissao?: string;
    subItens?: ISubMenu[];
  }

  interface ISubMenu {
    titulo: string;
    url: string;
  }

  const menuUsuario: IMenu[] = [
    {
      icone: House,
      titulo: "Página Inicial",
      url: "/",
    },
  ];

  const menuAdmin: IMenu[] = [
    {
      icone: Users,
      titulo: "Usuários",
      url: "/usuarios",
      permissao: "usuario_buscar_tudo",
    },
    {
      icone: Building2,
      titulo: "Unidades",
      url: "/unidades",
    },
    {
      icone: UserCircle,
      titulo: "Interessados",
      url: "/interessados",
    },
    {
      icone: KeyRound,
      titulo: "Permissões",
      url: "/permissoes",
    },
    {
      icone: FileText,
      titulo: "Logs",
      url: "/logs",
    },
  ];

  return (
    <SidebarContent>
      <SidebarGroup className="space-y-2">
        {menuUsuario && (
          <>
            <SidebarGroupLabel>Geral</SidebarGroupLabel>
            <SidebarMenu>
              {menuUsuario.map((item: IMenu) =>
                item.subItens ? (
                  <Collapsible
                    key={item.titulo}
                    asChild
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.titulo}>
                          {item.icone && <item.icone />}
                          <span>{item.titulo}</span>
                          {item.subItens && (
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.subItens && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItens?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.titulo}>
                                <Link href={item.url || "#"}>
                                  {item.icone && <item.icone />}
                                  <span>{item.titulo}</span>
                                </Link>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.titulo} className="z-50">
                    <Link href={item.url || "#"}>
                      {item.icone && <item.icone />}
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </>
        )}
        {menuAdmin && usuario && isDev && (
          <>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarMenu>
              {menuAdmin.map((item) =>
                item.subItens ? (
                  <Collapsible
                    key={item.titulo}
                    asChild
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.titulo}>
                          {item.icone && <item.icone />}
                          <span>{item.titulo}</span>
                          {item.subItens && (
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.subItens && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItens?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.titulo}>
                                <Link href={item.url || "#"}>
                                  {item.icone && <item.icone />}
                                  <span>{item.titulo}</span>
                                </Link>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.titulo} className="z-50">
                    <Link href={item.url || "#"}>
                      {item.icone && <item.icone />}
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </>
        )}
      </SidebarGroup>
    </SidebarContent>
  );
}
