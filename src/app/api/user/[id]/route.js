import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(req, context) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  if (!id || !ObjectId.isValid(id))
    return Response.json({ error: 'Invalid user id' }, { status: 400 })

  const users = await getCollection('Users')
  const found = await users.findOne({ _id: new ObjectId(id) })
  if (!found) return Response.json({ error: 'User not found' }, { status: 404 })

  // Only return public fields
  return Response.json({
    _id: found._id.toString(),
    username: found.username,
    name: found.name,
    bio: found.bio ?? '',
    avatarUrl: found.avatarUrl ?? null,
    joinedAt: found._id.getTimestamp(),
  })
}