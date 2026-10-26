"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Product, ResponseProductsApi } from "@/types/product.type";

const FAVORITES_KEY = "favorite-products";
const FAVORITES_EVENT = "favorites-changed";

function subscribeToFavorites(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(FAVORITES_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(FAVORITES_EVENT, callback);
  };
}

function favoritesSnapshot() {
  return window.localStorage.getItem(FAVORITES_KEY) ?? "[]";
}

export default function ProductsView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const favoritesRaw = useSyncExternalStore(subscribeToFavorites, favoritesSnapshot, () => "[]");
  const favorites = useMemo(() => {
    try {
      const ids: unknown = JSON.parse(favoritesRaw);
      return new Set(Array.isArray(ids) ? ids.filter((id): id is number => Number.isInteger(id)) : []);
    } catch {
      return new Set<number>();
    }
  }, [favoritesRaw]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(search.trim())}`, { signal: controller.signal });
        if (response.status === 401) {
          router.replace("/");
          router.refresh();
          return;
        }
        const data: ResponseProductsApi & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Falha ao buscar produtos.");
        setProducts(data.products);
        setTotal(data.total);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setProducts([]);
        setError(caught instanceof Error ? caught.message : "Falha ao buscar produtos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 300 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, reload, router]);

  function toggleFavorite(id: number) {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new Event(FAVORITES_EVENT));
    } catch {
      setError("Não foi possível salvar os favoritos neste navegador.");
    }
  }

  async function logout() {
    setLogoutError("");
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.localStorage.removeItem(FAVORITES_KEY);
      window.dispatchEvent(new Event(FAVORITES_EVENT));
      router.replace("/");
      router.refresh();
    } catch {
      setLogoutError("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Produtos</h1>
        <button type="button" onClick={logout} className="rounded border border-gray-500 px-4 py-2 hover:bg-gray-100">Sair</button>
      </header>
      {logoutError && <p role="alert" className="mb-4 text-red-700">{logoutError}</p>}
      <label htmlFor="search" className="mb-6 block max-w-lg">
        <span className="mb-2 block font-medium">Buscar produtos</span>
        <input id="search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setLoading(true); }} placeholder="Digite o nome de um produto" className="w-full rounded border border-gray-400 px-3 py-2" />
      </label>
      {loading ? (
        <p role="status">Carregando produtos...</p>
      ) : error ? (
        <div role="alert">
          <p className="mb-3 text-red-700">{error}</p>
          <button type="button" onClick={() => { setLoading(true); setReload((value) => value + 1); }} className="rounded border border-gray-500 px-4 py-2">Tentar novamente</button>
        </div>
      ) : products.length === 0 ? (
        <p>Nenhum produto encontrado.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">Exibindo {products.length} de {total} produtos</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id} className="flex flex-col rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="relative mb-3 h-44 w-full">
                  <Image src={product.thumbnail} alt={product.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain" />
                </div>
                <h2 className="text-lg font-semibold">{product.title}</h2>
                <p className="mb-2 text-sm text-gray-600">{product.category}</p>
                <p>Preço: US$ {product.price.toFixed(2)}</p>
                <p>Avaliação: {product.rating.toFixed(1)} / 5</p>
                <p className="mb-4">Estoque: {product.stock}</p>
                <button type="button" aria-pressed={favorites.has(product.id)} onClick={() => toggleFavorite(product.id)} className="mt-auto rounded border border-gray-500 px-3 py-2 text-left hover:bg-gray-100">
                  {favorites.has(product.id) ? "♥ Remover dos favoritos" : "♡ Adicionar aos favoritos"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
