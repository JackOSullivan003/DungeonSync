import { getCurrentUser } from "@/lib/auth"
import HomeClient from "./HomeClient"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    return <HomeClient user={null} />
  }

  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username,
    type: user.type,
  }

  return <HomeClient user={safeUser} />
}
