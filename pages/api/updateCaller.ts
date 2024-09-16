import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { slug } = req.query;

      if (!slug || typeof slug !== "string") {
        return res.status(400).json({ error: "Invalid slug parameter" });
      }

      const { db } = await connectToDatabase();
      const collection = db.collection("CallData");

      const branchName = getBranchName(slug);

      // Fetch the active caller for the specific branch
      const activeCaller = await collection.findOne({
        branch: branchName,
        callerStatus: true,
      });

      // Fetch all callers
      const allCallers = await collection.find({}).toArray();

      res.status(200).json({ activeCaller, allCallers });
    } catch (error) {
      console.error("Error fetching caller data:", error);
      res.status(500).json({ error: "Error fetching caller data" });
    }
  } else if (req.method === "POST") {
    try {
      const { slug, callerId } = req.body;

      if (!slug || typeof slug !== "string" || !callerId) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const { db } = await connectToDatabase();
      const collection = db.collection("CallData");

      const branchName = getBranchName(slug);

      // Check if the caller is already active in another branch
      const activeCaller = await collection.findOne({
        _id: new ObjectId(callerId),
        callerStatus: true,
      });

      if (activeCaller && activeCaller.branch !== branchName) {
        return res.status(400).json({
          error: `This person is already an active caller for ${activeCaller.branch}. Please select someone else.`,
        });
      }

      // Set all callers for this branch to inactive
      await collection.updateMany(
        { branch: branchName },
        { $set: { callerStatus: false } }
      );

      // Set the selected caller as active for this branch
      await collection.updateOne(
        { _id: new ObjectId(callerId) },
        { $set: { callerStatus: true, branch: branchName } }
      );

      // Fetch updated caller data
      const updatedCallerData = await collection.find({}).toArray();

      res.status(200).json(updatedCallerData);
    } catch (error) {
      console.error("Error updating caller status:", error);
      res.status(500).json({ error: "Error updating caller status" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function getBranchName(slug: string): string {
  switch (slug) {
    case "sevoke":
      return "Sevoke Road";
    case "dagapur":
      return "Dagapur";
    default:
      return slug;
  }
}