import { cookies } from "next/headers" // helper to read and modify cookies
import { getCollection } from "@/lib/mongodb" // MongoDB Helper File
import { ObjectId } from "mongodb" // MongoDB ObjectId type

// POST is used to log out a user by deleting their session and clearing their cookie
export async function POST() {
  const cookieStore = await cookies() // get cookie storage
  const sessionId = cookieStore.get("sessionId")?.value // read sessionId cookie

  if (sessionId) {
    try {
      const sessions = await getCollection("Sessions") // access Sessions collection
      await sessions.deleteOne({ _id: new ObjectId(sessionId) }) // remove session from database
    } catch (err) {
      console.error("Logout error:", err) // log error if delete fails
    }
  }
  // Clear cookie regardless
  cookieStore.delete() // remove session cookie from browser

  return Response.json({ ok: true }) // return success response
}