import { getCollection } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'

export default async function PublicProfilePage({ params }) {
  const { username } = await params
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/')

  const users = await getCollection('Users')
  const found = await users.findOne({ username })

  if (!found) return <p>User not found.</p>

  // If viewing own profile, redirect to /profile
  if (found._id.toString() === currentUser._id.toString()) redirect('/profile')

  return <PublicProfileClient profile={{
    _id: found._id.toString(),
    username: found.username,
    name: found.name,
    bio: found.bio ?? '',
    avatarUrl: found.avatarUrl ?? null,
    joinedAt: found._id.getTimestamp(),
  }} currentUser={{
    _id: currentUser._id.toString(),
    username: currentUser.username,
  }} />
}