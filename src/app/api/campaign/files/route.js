import { getCollection } from "@/lib/mongodb";

export async function GET() {
  try {
    const collection = await getCollection("Files");
    const notes = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return Response.json(notes);
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return Response.json([], { status: 500 }); // always return an array
  }
}

export async function POST(req) {
  try {
    const collection = await getCollection("Files");
    const { title } = await req.json();

    const newNote = {
      title,
      content: "",
      updatedAt: Date.now(),
    };

    const result = await collection.insertOne(newNote);

    return Response.json({ ...newNote, _id: result.insertedId });
  } catch (err) {
    console.error("POST /api/files error:", err);
    return Response.json({ error: "Failed to create file" }, { status: 500 });
  }
}
