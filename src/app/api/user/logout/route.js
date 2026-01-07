import { cookies } from "next/headers"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (sessionId) {
    try {
      const sessions = await getCollection("Sessions")
      await sessions.deleteOne({ _id: new ObjectId(sessionId) })
    } catch (err) {
      console.error("Logout error:", err)
      // still proceed to clear cookie
    }
  }

  // Clear cookie regardless
  cookieStore.set("sessionId", "", {
    path: "/",
    maxAge: 0,
  })

  return Response.json({ ok: true })
}
