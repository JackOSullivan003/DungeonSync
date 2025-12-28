import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';


export async function GET() {
  try {
    const collection = await getCollection("Files");
    const files = await collection.find({}).toArray();

    return Response.json(files);
  } catch (err) {
    console.error("GET files error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const body = await req.json();
    const { title = "Untitled", folderId = null } = body;

    const collection = await getCollection("Files");

    const newFile = {
      title,
      content: "",
      folderId: folderId ? new ObjectId(folderId) : null,
      updatedAt: Date.now(),
    };

    const result = await collection.insertOne(newFile);
    newFile._id = result.insertedId;

    return Response.json(newFile);
  } catch (err) {
    console.error("POST file error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
