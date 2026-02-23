import { getCollection } from "@/lib/mongodb" // MongoDB Helper File
import bcrypt from "bcrypt" // library for hashing and comparing passwords
import { ObjectId } from "mongodb" // MongoDB ObjectId type

// GET is used to log in a user by email and password
export async function GET(req) {
  console.log("in the login api") // debug log

  const { searchParams } = new URL(req.url) // parse query parameters
  const email = searchParams.get("email") // get email from URL
  const pass = searchParams.get("pass") // get password from URL

  try {
    const users = await getCollection("Users") // access Users collection
    const user = await users.findOne({ email }) // find user by email

    if (!user) {
      return Response.json({ data: "invalid" }) // no user found
    }

    const validPass = await bcrypt.compare(pass, user.pass) // check password
    if (!validPass) {
      return Response.json({ data: "invalid" }) // wrong password
    }

    // Create session
    const sessions = await getCollection("Sessions") // access Sessions collection
    const session = {
      userId: user._id, // link session to user
      createdAt: new Date(), // session start time
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days expiration
    }

    const result = await sessions.insertOne(session) // save session to DB

    console.log(result) // debug log inserted session
    // Set HTTP-only cookie
    return new Response(
      JSON.stringify({ data: "valid" }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `sessionId=${result.insertedId}; HttpOnly; Path=/; SameSite=Lax`, // secure cookie
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error("DB error:", error) // log DB error
    return Response.json(
      { data: "invalid", error: "DB connection failed" },
      { status: 500 }
    )
  }
}