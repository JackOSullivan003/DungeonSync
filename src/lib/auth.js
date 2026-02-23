import { cookies } from "next/headers" // helper to read and modify cookies
import { getCollection } from "@/lib/mongodb" // MongoDB Helper File
import { ObjectId } from "mongodb" // MongoDB ObjectId type

//checking session data
//checking if session is expired is done on the mongodb side, the length is decided when the session is created by the login api route.js

export async function getCurrentUser() {
  const cookieStore = await cookies() // get cookie storage
  const sessionId = cookieStore.get("sessionId")?.value // read sessionId cookie

  if (!sessionId) return null // no session cookie means no logged-in user

  const sessions = await getCollection("Sessions") // access Sessions collection
  const session = await sessions.findOne({ _id: new ObjectId(sessionId) }) // find session in database

  if (!session) return null // session not found or expired

  const users = await getCollection("Users") // access Users collection
  const user = await users.findOne({ _id: new ObjectId(session.userId) }) // find user linked to session

  return user || null // return user or null if not found
}