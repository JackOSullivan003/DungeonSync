import { getCollection } from "@/lib/mongodb";

export async function GET(req, res) {

        // Make a note we are on
        // the api. This goes to the console.

        const collection = await getCollection("campaigns");

        const findResult = await collection.find({}).toArray();

        console.log('Found documents =>', findResult);

       //==========================================================
        // at the end of the process we need to send something back.

        return Response.json(findResult)

  }