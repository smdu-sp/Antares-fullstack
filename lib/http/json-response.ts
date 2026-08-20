import { NextResponse } from 'next/server';

function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  return new NextResponse(JSON.stringify(data, bigIntReplacer), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
}
