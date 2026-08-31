/** @format */

import { redirect } from "next/navigation";

// /grupos-acesso foi incorporado como abas dentro de /usuarios (visíveis só para
// usuários dev). Mantido como redirect pra não quebrar links/favoritos antigos.
export default function GruposAcessoPage() {
  redirect("/usuarios");
}
