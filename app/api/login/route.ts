import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie usuário e senha válidos." }, { status: 400 });
  }

  if (!body || typeof body.username !== "string" || !body.username.trim() || typeof body.password !== "string" || !body.password) {
    return NextResponse.json({ error: "Informe o usuário e a senha." }, { status: 400 });
  }
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Senha do aplicativo não configurada no servidor." }, { status: 500 });
  }
  if (!passwordMatches(body.password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Não foi possível iniciar a sessão." }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
