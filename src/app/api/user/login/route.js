import { getCollection } from "@/lib/mongodb"
import bcrypt from "bcrypt"
import { ObjectId } from "mongodb"

export async function GET(req) {
  console.log("in the login api")

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const pass = searchParams.get("pass")

  try {
    const users = await getCollection("Users")
    const user = await users.findOne({ email })

    if (!user) {
      return Response.json({ data: "invalid" })
    }

    const validPass = await bcrypt.compare(pass, user.pass)
    if (!validPass) {
      return Response.json({ data: "invalid" })
    }

    // Create session
    const sessions = await getCollection("Sessions")
    const session = {
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    }

    const result = await sessions.insertOne(session)

    console.log(result)
    // Set HTTP-only cookie
    return new Response(
      JSON.stringify({ data: "valid" }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `sessionId=${result.insertedId}; HttpOnly; Path=/; SameSite=Lax`,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error("DB error:", error)
    return Response.json(
      { data: "invalid", error: "DB connection failed" },
      { status: 500 }
    )
  }
}
