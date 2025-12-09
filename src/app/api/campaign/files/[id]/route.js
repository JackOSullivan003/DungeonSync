import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const collection = await getCollection("Files");
    const note = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!note) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json(note);
  } catch (err) {
    console.error("GET note error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const collection = await getCollection("Files");
    const body = await req.json();

    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: body.title,
          content: body.content,
          updatedAt: Date.now(),
        },
      }
    );

    const updated = await collection.findOne({
      _id: new ObjectId(id),
    });

    return Response.json(updated);
  } catch (err) {
    console.error("PATCH note error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const collection = await getCollection("Files");

    await collection.deleteOne({
      _id: new ObjectId(id),
    });

    return Response.json({ deleted: true });
  } catch (err) {
    console.error("DELETE note error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
