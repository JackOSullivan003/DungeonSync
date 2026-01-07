export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  //serialization error fix
  const safeUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? null,
    type: user.type ?? null,
    username: user.username ?? null,
  }


  return <DashboardClient user={safeUser} />
}
