// Teto de paginação: original não tinha limite máximo (`limite` vinha direto do
// cliente), o que permitia pedir a tabela inteira de uma vez numa única página
// (ex.: `?limite=999999`). Adicionado por segurança/escala — nenhum uso legítimo
// no sistema hoje pede mais que algumas centenas de linhas por página.
const LIMITE_MAXIMO = 500;

/** Porte de AppService.verificaPagina/verificaLimite (Antares-backend/src/app.service.ts). */
export function verificaPagina(pagina?: number, limite?: number): [number, number] {
  if (!pagina) pagina = 1;
  if (!limite) limite = 10;
  if (pagina < 1) pagina = 1;
  if (limite < 1) limite = 10;
  if (limite > LIMITE_MAXIMO) limite = LIMITE_MAXIMO;
  return [pagina, limite];
}

export function verificaLimite(pagina: number, limite: number, total: number): [number, number] {
  if ((pagina - 1) * limite >= total) pagina = Math.ceil(total / limite);
  return [pagina, limite];
}
