import { getCollection } from "@/lib/mongodb";

export async function GET(req, res) {


        const collection = await getCollection("campaigns");

        const findResult = await collection.find({}).toArray();

        console.log('Found documents =>', findResult);


        return Response.json(findResult)

  }