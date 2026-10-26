"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.replace("/products");
      router.refresh();
    } catch {
      setError("Falha na comunicação com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="username" className="flex flex-col gap-1">
          Usuário
          <input className="rounded border border-gray-400 px-3 py-2" type="text" id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label htmlFor="password" className="flex flex-col gap-1">
          Senha
          <input className="rounded border border-gray-400 px-3 py-2" type="password" id="password" name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
