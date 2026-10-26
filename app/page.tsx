import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isSessionValid, SESSION_COOKIE } from "@/lib/auth";
import LoginForm from "./login-form";

export const instant = false;

export default async function Home() {
  await connection();
  const cookieStore = await cookies();
  if (isSessionValid(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/products");
  return <LoginForm />;
}
