import { getCurrentUser } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"

export async function PATCH(req) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { username, avatarUrl } = await req.json()

  const users = await getCollection("Users")

  // username uniqueness check
  if (username) {
    const existing = await users.findOne({
      username,
      _id: { $ne: user._id }
    })

    if (existing) {
      return Response.json(
        { error: "Username already taken" },
        { status: 400 }
      )
    }
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        ...(username && { username }),
        ...(avatarUrl && { avatarUrl }),
        updatedAt: new Date()
      }
    }
  )

  return Response.json({ ok: true })
}
