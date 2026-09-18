#!/usr/bin/env node
// Gera o valor de USUARIO_LOCAL_SENHA_HASH pro .env — usado pelo usuário local
// único que autentica sem LDAP (ver lib/server/auth/validate-credentials.ts e
// lib/server/auth/local-user-password.ts). Reexecute pra trocar a senha.
//
// Uso: node scripts/gerar-hash-senha-local.mjs "senha-aqui"

import { randomBytes, scryptSync } from "node:crypto";

const senha = process.argv[2];

if (!senha) {
  console.error('Uso: node scripts/gerar-hash-senha-local.mjs "senha"');
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(senha, salt, 64).toString("hex");

console.log("\nAdicione/atualize no .env:\n");
console.log(`USUARIO_LOCAL_LOGIN=<login do usuário já cadastrado em /usuarios>`);
console.log(`USUARIO_LOCAL_SENHA_HASH=${salt}:${hash}`);
console.log("");
