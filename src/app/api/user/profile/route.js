import { getCollection } from '@/lib/mongodb' // MongoDB Helper File
import { getCurrentUser } from '@/lib/auth' // auth Helper File

// PATCH is used to update the logged-in user's profile info
export async function PATCH(req) {
  const user = await getCurrentUser() // check who is making the request
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 }) // block if not logged in
  }

  const { username, avatarUrl } = await req.json() // read profile fields from request body

  const users = await getCollection("Users") // access Users collection

  // username uniqueness check
  if (username) {
    const existing = await users.findOne({
      username,
      _id: { $ne: user._id } // make sure another user doesn't already have this username
    })

    if (existing) {
      return Response.json(
        { error: "Username already taken" },
        { status: 400 }
      ) // stop if username is already used
    }
  }

  await users.updateOne(
    { _id: user._id }, // update this user's record
    {
      $set: {
        ...(username && { username }), // update username if provided
        ...(avatarUrl && { avatarUrl }), // update avatar if provided
        updatedAt: new Date()
      }
    }
  )

  return Response.json({ ok: true }) // confirm update success
}