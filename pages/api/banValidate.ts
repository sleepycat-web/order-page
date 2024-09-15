// pages/api/banValidate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return res.status(400).json({ error: "Phone number is required" });
    }

    try {
      const { db } = await connectToDatabase();
      const userData = await db.collection("UserData").findOne({ phoneNumber });

      if (userData && userData.banStatus === true) {
        res.status(200).json({ isBanned: true });
      } else {
        res.status(200).json({ isBanned: false });
      }
    } catch (error) {
      console.error("Error checking ban status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
