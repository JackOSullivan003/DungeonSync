import { getCollection } from "@/lib/mongodb"; // helper to access MongoDB collections
import bcrypt from "bcrypt"; // library for hashing passwords

// GET is used to register a new user account
export async function GET(req) {
  console.log("in the register api"); // debug log

  const { searchParams } = new URL(req.url); // read query parameters
  const firstName = searchParams.get("first"); // get first name
  const lastName = searchParams.get("last"); // get last name
  const email = searchParams.get("email"); // get email
  const pass = searchParams.get("pass"); // get password
  
  const fullName = firstName + " " + lastName; // combine first and last name
  console.log(fullName); // debug log
  console.log(email);

  if (!firstName || !lastName || !email || !pass) {
    return Response.json({ data: "invalid" }); // stop if any field missing
  }

  try {
    const collection = await getCollection("Users"); // access Users collection

    // Check if user exists
    const existing = await collection.findOne({ email }); // check if email already registered
    if (existing) {
      return Response.json({ data: "exists" }); // stop if user already exists
    }

    // hash password 
    const hashedPassword = await bcrypt.hash(pass, 10); // hash password before saving

    // Create user
    const result = await collection.insertOne({ name:fullName ,email, pass:hashedPassword, type:"user" }); // save new user

    // Create session so the user is logged in immediately after registration
    const sessions = await getCollection("Sessions");
    const session = {
      userId: result.insertedId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    };

    const sessionResult = await sessions.insertOne(session);

    return new Response(
      JSON.stringify({ data: "created" }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `sessionId=${sessionResult.insertedId}; HttpOnly; Path=/; SameSite=Lax`,
          "Content-Type": "application/json",
        },
      }
    ); // confirm user created and session started

  } catch (error) {
    console.error("DB error:", error); // log DB error
    return Response.json({ data: "invalid" }, { status: 500 });
  }
}
