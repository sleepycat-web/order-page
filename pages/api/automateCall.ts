import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import { sendCall } from "./sendCall"; // Import the sendCall function

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { selectedLocation } = req.body;

    // Determine the branch based on selectedLocation
    let branch;
    if (selectedLocation.includes("Sevoke Road")) {
      branch = "Sevoke Road";
    } else if (selectedLocation.includes("Dagapur")) {
      branch = "Dagapur";
    } else {
      return res.status(400).json({ message: "Invalid location" });
    }

    // Query the CallData collection for a single document
    const selectedCaller = await db
      .collection("CallData")
      .findOne({ branch, callerStatus: true }, { sort: { dateUpdated: -1 } });

    if (!selectedCaller) {
      return res.status(404).json({ message: "No available caller found" });
    }

    // Add a leading "0" to the selected caller's phone number
    // const callerPhoneNumber = `0${selectedCaller.phoneNumber}`;
    const callerPhoneNumber = `0 `;

    // Call the sendCall function with the required parameters
    await sendCall({
      from: callerPhoneNumber,
      to: req.body.customerPhoneNumber, // Assuming this is provided in the request body
    });

    res.status(200).json({
      message: "Call initiated successfully",
      selectedCaller: {
        name: selectedCaller.name,
        phoneNumber: callerPhoneNumber, // Use the modified phone number here
        branch: selectedCaller.branch,
      },
    });
  } catch (error) {
    console.error("Error in automateCall:", error);
    res.status(500).json({ message: "Error initiating automated call" });
  }
}
