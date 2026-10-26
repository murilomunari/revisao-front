import { NextRequest, NextResponse } from "next/server";
import { getProductsUrl } from "@/lib/products";
import { isSessionValid, SESSION_COOKIE } from "@/lib/auth";
import type { ResponseProductsApi } from "@/types/product.type";

export async function GET(request: NextRequest) {
  if (!isSessionValid(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Faça login para ver os produtos." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const response = await fetch(getProductsUrl(search), { cache: "no-store" });
    if (!response.ok) throw new Error(`DummyJSON respondeu ${response.status}`);
    const data: ResponseProductsApi = await response.json();
    if (!Array.isArray(data.products)) throw new Error("Resposta inválida da DummyJSON");
    return NextResponse.json({ ...data, products: data.products.slice(0, 15) });
  } catch (error) {
    console.error("Falha ao buscar produtos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os produtos. Tente novamente." }, { status: 502 });
  }
}
