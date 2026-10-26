import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isSessionValid, SESSION_COOKIE } from "@/lib/auth";
import ProductsView from "./products-view";

export const instant = false;

export default async function ProductsPage() {
  await connection();
  const cookieStore = await cookies();
  if (!isSessionValid(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/");
  return <ProductsView />;
}
