/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import * as usuario from "@/services/usuarios";
import { listaCompleta } from "@/services/unidades/query-functions";
import {
  listarGruposDev,
  atualizarGrupoUsuarioDev,
  type GrupoDev,
} from "@/services/acessos-admin";
import { IUsuario } from "@/types/usuario";
import { IUnidade } from "@/types/unidade";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchemaUsuario = z.object({
  nome: z.string(),
  login: z.string(),
  email: z.string().email(),
  dev: z.boolean(),
  unidade_id: z.string().min(1, "Unidade é obrigatória"),
  grupo_id: z.string().optional(),
  papel: z.enum(["ADM", "TEC", "USR"]).optional(),
});

const formSchema = z.object({
  login: z.string(),
});

interface FormUsuarioProps {
  isUpdating: boolean;
  user?: Partial<IUsuario>;
  onSuccess?: () => void;
}

export default function FormUsuario({
  isUpdating,
  user,
  onSuccess,
}: FormUsuarioProps) {
  const [isPending, startTransition] = useTransition();
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [grupos, setGrupos] = useState<GrupoDev[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);

  const formUsuario = useForm<z.infer<typeof formSchemaUsuario>>({
    resolver: zodResolver(formSchemaUsuario),
    defaultValues: {
      email: user?.email || "",
      login: user?.login || "",
      nome: user?.nome || "",
      dev: user?.dev ?? false,
      unidade_id: user?.unidade_id || "",
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: "",
    },
  });

  const { data: session, update } = useSession();
  const isDev = session?.usuario?.dev === true;

  // Buscar unidades ao montar o componente
  useEffect(() => {
    async function carregarUnidades() {
      if (session?.access_token) {
        try {
          const response = await listaCompleta(session.access_token);
          if (response.ok && response.data) {
            setUnidades(response.data as IUnidade[]);
          }
        } catch (error) {
          console.error("Erro ao carregar unidades:", error);
        } finally {
          setLoadingUnidades(false);
        }
      }
    }
    carregarUnidades();
  }, [session]);

  // Grupo/papel só é escolhido na criação, e só por DEV (mesma fronteira do
  // modal Governança DEV — um ADM comum não tem hoje como atribuir grupo a
  // ninguém, nem na criação nem depois).
  useEffect(() => {
    async function carregarGrupos() {
      if (!isUpdating && isDev) {
        const response = await listarGruposDev();
        if (response.ok && response.data) {
          setGrupos(response.data);
        }
      }
      setLoadingGrupos(false);
    }
    carregarGrupos();
  }, [isUpdating, isDev]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token = session?.access_token;
    if (!token) {
      toast.error("Não autorizado");
      return;
    }
    const { login } = values;
    const resp = await usuario.buscarNovo(login, token);

    if (resp.error) {
      toast.error("Algo deu errado", { description: resp.error });
    }

    if (resp.ok && resp.data) {
      const usuario = resp.data as IUsuario;
      toast.success("Usuário encontrado", { description: usuario.nome });
      formUsuario.setValue("nome", usuario.nome);
      formUsuario.setValue("email", usuario.email);
      formUsuario.setValue("login", usuario.login);
    }
  }

  async function onSubmitUser(values: z.infer<typeof formSchemaUsuario>) {
    startTransition(async () => {
      if (isUpdating && user?.id) {
        const resp = await usuario.atualizar(user?.id, {
          dev: values.dev,
          unidade_id: values.unidade_id,
        });

        if (resp.error) {
          toast.error("Algo deu errado", { description: resp.error });
        }

        if (resp.ok) {
          await update({
            ...session,
            usuario: {
              ...session?.usuario,
              dev: values.dev,
            },
          });

          toast.success("Usuário Atualizado", { description: resp.status });
          onSuccess?.();
        }
      } else {
        const { email, login, nome, dev, unidade_id, grupo_id, papel } = values;
        const resp = await usuario.criar({
          email,
          login,
          nome,
          dev,
          unidade_id,
        });
        if (resp.error) {
          toast.error("Algo deu errado", { description: resp.error });
        }
        if (resp.ok && resp.data) {
          const novoUsuarioId = (resp.data as IUsuario).id;

          if (grupo_id && novoUsuarioId) {
            const vinculoResp = await atualizarGrupoUsuarioDev(
              novoUsuarioId,
              grupo_id,
              { ativo: true, permissao_grupo: papel || "USR" },
            );

            if (!vinculoResp.ok) {
              toast.error(
                "Usuário criado, mas não foi possível vincular o grupo",
                { description: vinculoResp.error || undefined },
              );
              onSuccess?.();
              return;
            }
          }

          toast.success("Usuário Criado", { description: resp.status });
          onSuccess?.();
        }
      }
    });
  }

  return (
    <>
      {!isUpdating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className=" flex items-end gap-2 w-full mb-5"
          >
            <FormField
              control={form.control}
              name="login"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Login de rede</FormLabel>
                  <FormControl>
                    <Input placeholder="Login do usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={form.formState.isLoading || !form.formState.isValid}
              type="submit"
            >
              {form.formState.isLoading || form.formState.isSubmitting ? (
                <>
                  Buscar <Loader2 className="animate-spin" />
                </>
              ) : (
                <>
                  Buscar <ArrowRight />
                </>
              )}
            </Button>
          </form>
        </Form>
      )}

      <Form {...formUsuario}>
        <form
          onSubmit={formUsuario.handleSubmit(onSubmitUser)}
          className="space-y-4"
        >
          <FormField
            control={formUsuario.control}
            name="login"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Login de rede</FormLabel>
                <FormControl>
                  <Input disabled placeholder="Login do usuário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formUsuario.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input disabled placeholder="Nome do usuário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formUsuario.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    disabled
                    type="email"
                    placeholder="E-mail do usuário"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formUsuario.control}
            name="dev"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <FormLabel className="!mt-0">É desenvolvedor?</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formUsuario.control}
            name="unidade_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingUnidades}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingUnidades
                            ? "Carregando..."
                            : "Selecione a unidade"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isUpdating && isDev && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 rounded-md border p-3">
              <FormField
                control={formUsuario.control}
                name="grupo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingGrupos}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingGrupos
                                ? "Carregando..."
                                : "Sem grupo (opcional)"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grupos.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {grupo.sigla ? `${grupo.sigla} - ${grupo.nome}` : grupo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formUsuario.control}
                name="papel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papel no grupo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "USR"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADM">ADM</SelectItem>
                        <SelectItem value="TEC">TEC</SelectItem>
                        <SelectItem value="USR">USR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <div className="flex gap-2 items-center justify-end">
            <DialogClose asChild>
              <Button variant={"outline"}>Voltar</Button>
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {isUpdating ? (
                <>
                  Atualizar {isPending && <Loader2 className="animate-spin" />}
                </>
              ) : (
                <>
                  Adicionar {isPending && <Loader2 className="animate-spin" />}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
