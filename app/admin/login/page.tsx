import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin, localAuthAllowed } from "@/lib/auth";
import { usingSupabase } from "@/lib/db";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm withEmail={usingSupabase} ready={usingSupabase || localAuthAllowed()} />;
}
