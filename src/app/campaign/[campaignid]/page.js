import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import CampaignClient from "./CampaignClient"

export default async function CampaignPage({ params }) {
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


  return (
    <CampaignClient
      user={safeUser}
      params={params}
    />
  )
}
