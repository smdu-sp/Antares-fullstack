/** @format */

import type { IGrupoAtivo } from "./grupo-ativo";

declare module "next-auth" {
  interface Session {
    id: string;
    usuario: {
      sub: string;
      nome: string;
      nomeSocial?: string;
      login: string;
      email: string;
      dev: boolean;
      status: number;
      avatar?: string;
      iat: number;
      exp: number;
    };
    access_token: string;
    refresh_token: string;
    grupoAtivo?: IGrupoAtivo;
  }
}
