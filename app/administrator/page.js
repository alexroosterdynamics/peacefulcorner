import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";
import AdminApp from "./ui/AdminApp";

export default async function AdminPage() {
  const cookieStore = await cookies(); // ✅ important in Next 16+
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const session = verifySession(token);
  return <AdminApp initialSession={session} />;
}
