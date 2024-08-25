import { NextApiRequest, NextApiResponse } from "next";
import { checkUserExists, addNewUser, getUserData } from "./db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { action, phoneNumber, name, email } = req.body;

    try {
      switch (action) {
        case "checkUserExists":
          const exists = await checkUserExists(phoneNumber);
          res.status(200).json({ exists });
          break;
        case "addNewUser":
          await addNewUser(phoneNumber, name, email);
          res.status(200).json({ success: true });
          break;
        case "getUserData":
          const userData = await getUserData(phoneNumber);
          res.status(200).json(userData);
          break;
        default:
          res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
