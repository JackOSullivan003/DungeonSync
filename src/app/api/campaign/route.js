import { getCollection } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const collection = await getCollection("Folders");

    const newFolder = {
      title: body.title || "New Folder",
      parentId: body.parentId || null,
      createdAt: Date.now(),
    };

    const result = await collection.insertOne(newFolder);
    return new Response(JSON.stringify({ ...newFolder, _id: result.insertedId }), { status: 201 });
  } catch (err) {
    console.error("POST folder error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function GET() {
  try {
    const collection = await getCollection("Folders");
    const folders = await collection.find({}).toArray();
    return new Response(JSON.stringify(folders), { status: 200 });
  } catch (err) {
    console.error("GET folders error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
