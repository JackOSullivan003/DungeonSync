import { cookies } from "next/headers"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"


//checking session data
//checking if session is expired is done on the mongodb side, the length is decided when the session is created by the login api route.js

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) return null

  const sessions = await getCollection("Sessions")
  const session = await sessions.findOne({ _id: new ObjectId(sessionId) })

  if (!session) return null

  const users = await getCollection("Users")
  const user = await users.findOne({ _id: new ObjectId(session.userId) })

  return user || null
}
