import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb"; // Adjust the import path as needed

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

      const callerData = await collection.find({}).toArray();

      res.status(200).json(callerData);
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

      // Get the branch name based on the slug
      const branchName = getBranchName(slug);

      // Find the caller to be set active
      const callerToActivate = await collection.findOne({ _id: callerId });

      if (!callerToActivate) {
        return res.status(404).json({ error: "Caller not found" });
      }

      // Check if the caller is already active in another branch
      if (
        callerToActivate.callerStatus &&
        callerToActivate.branch !== branchName
      ) {
        return res
          .status(400)
          .json({ error: "Caller is already active in another branch" });
      }

      // Set all callers in the current branch to inactive
      await collection.updateMany(
        { branch: branchName },
        { $set: { callerStatus: false } }
      );

      // Set the selected caller as active and update their branch
      await collection.updateOne(
        { _id: callerId },
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
