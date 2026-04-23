import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')

  return <ProfileClient user={{
    _id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio ?? '',
    avatar: user.avatar ?? null,
    avatarMimeType: user.avatarMimeType ?? null,
    joinedAt: user._id.getTimestamp(), //the _id value has a embedded timestamp of when the file was created, this can be used for the joinedAt value instead of a individual field
  }} />
}