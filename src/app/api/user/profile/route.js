import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return Response.json({
    _id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio ?? '',
    avatar: user.avatar ?? null, //no longer URL, as profile pic is also stored in DB now
    avatarMimeType: user.avatarMimeType ?? null,
    joinedAt: user._id.getTimestamp(), // MongoDB ObjectId contains creation timestamp
  })
}

export async function PATCH(req) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, bio, name, avatar, avatarMimeType } = await req.json()

  const users = await getCollection('Users')

  if (username) {
    const existing = await users.findOne({
      username,
      _id: { $ne: user._id }
    })
    if (existing) return Response.json({ error: 'Username already taken' }, { status: 400 })
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        ...(username && { username }),
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(avatarMimeType !== undefined && { avatarMimeType }),
        updatedAt: new Date()
      }
    }
  )

  return Response.json({ ok: true })
}