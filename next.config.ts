/** @format */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
	},
	// pdfkit lê seus arquivos de fontes (.afm) do disco em runtime via caminho relativo
	// a __dirname — se o bundler empacotar o módulo, esse caminho quebra. Mantendo-o (e o
	// exceljs, pelo mesmo motivo preventivo) fora do bundle, o require resolve o pacote
	// normalmente a partir de node_modules.
	serverExternalPackages: ['pdfkit', 'exceljs'],
	allowedDevOrigins: [
		'10.20.4.6',
		'127.0.0.1'
	],
};

export default nextConfig;
