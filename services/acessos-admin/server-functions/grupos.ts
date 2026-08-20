/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  ICreateGrupo,
  IGrupo,
  IRespostaAcessosAdmin,
  IUpdateGrupo,
} from "@/types/grupo";

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = await response.json();
    if (data?.message && typeof data.message === "string") return data.message;
  } catch {
    // mantém fallback
  }
  return fallback;
}

export async function listarGrupos(): Promise<
  IRespostaAcessosAdmin<{ total: number; data: IGrupo[] }>
> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}acessos-admin/dev/grupos`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao listar grupos"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao listar grupos: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function criarGrupo(
  dados: ICreateGrupo,
): Promise<IRespostaAcessosAdmin<IGrupo>> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}acessos-admin/dev/grupos`, {
      method: "POST",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao criar grupo"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    revalidateTag("grupos");
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao criar grupo: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function atualizarGrupo(
  id: string,
  dados: IUpdateGrupo,
): Promise<IRespostaAcessosAdmin<IGrupo>> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}acessos-admin/dev/grupos/${id}`, {
      method: "PATCH",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao atualizar grupo"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    revalidateTag("grupos");
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao atualizar grupo: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function desativarGrupo(
  id: string,
): Promise<IRespostaAcessosAdmin<{ sucesso: boolean }>> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}acessos-admin/dev/grupos/${id}`, {
      method: "DELETE",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao desativar grupo"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    revalidateTag("grupos");
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao desativar grupo: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function semearGruposPadrao(): Promise<
  IRespostaAcessosAdmin<{ total: number; data: IGrupo[] }>
> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/grupos/semeadura-padrao`,
      {
        method: "POST",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(response, "Erro ao semear grupos padrão"),
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    revalidateTag("grupos");
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao semear grupos padrão: ${error}`,
      data: null,
      status: 500,
    };
  }
}
