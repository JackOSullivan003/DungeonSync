import { getCollection } from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function GET(req) {
  console.log("in the register api");

  const { searchParams } = new URL(req.url);
  const firstName = searchParams.get("first");
  const lastName = searchParams.get("last");
  const email = searchParams.get("email");
  const pass = searchParams.get("pass");
  
  const fullName = firstName + " " + lastName;
  console.log(fullName);
  console.log(email);
  console.log(pass);

  if (!firstName || !lastName || !email || !pass) {
    return Response.json({ data: "invalid" });
  }

  try {
    const collection = await getCollection("Users");

    // Check if user exists
    const existing = await collection.findOne({ email });
    if (existing) {
      return Response.json({ data: "exists" });
    }

    // hash password 
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Create user
    await collection.insertOne({ name:fullName ,email, pass:hashedPassword, type:"customer" });

    return Response.json({ data: "created" });

  } catch (error) {
    console.error("DB error:", error);
    return Response.json({ data: "invalid" }, { status: 500 });
  }
}