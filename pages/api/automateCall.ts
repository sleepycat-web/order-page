import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import axios from "axios";

interface SendCallParams {
  from: string;
  to: string;
}

async function sendCall({ from, to }: SendCallParams): Promise<any> {
  const apiKey = process.env.EXOTEL_API_KEY;
  const apiToken = process.env.EXOTEL_API_TOKEN;
  const sid = process.env.EXOTEL_SID;
  const callerId = process.env.EXOTEL_CALLER_ID;
  const appId = process.env.EXOTEL_APP_ID;

  if (!apiKey || !apiToken || !sid || !callerId || !appId) {
    throw new Error("Missing required environment variables for Exotel API");
  }

  const url = `https://${apiKey}:${apiToken}@api.exotel.com/v1/Accounts/${sid}/Calls/connect`;
  const data = new URLSearchParams({
    From: from,
    To: to,
    CallerId: callerId,
    Url: `http://my.exotel.com/Exotel/exoml/start_voice/${appId}`,
  });

  try {
    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    // console.log("Call response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    // console.error("Error initiating call:", error);
    throw error;
  }
}

async function getCallStatus(callSid: string): Promise<string> {
  const apiKey = process.env.EXOTEL_API_KEY;
  const apiToken = process.env.EXOTEL_API_TOKEN;
  const sid = process.env.EXOTEL_SID;

  if (!apiKey || !apiToken || !sid) {
    throw new Error("Missing required environment variables for Exotel API");
  }

  const url = `https://${apiKey}:${apiToken}@api.exotel.com/v1/Accounts/${sid}/Calls/${callSid}.json`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
      },
    });

    // console.log("Full API response:", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.Call) {
      // console.log("Call status:", response.data.Call.Status);
      return response.data.Call.Status || "unknown";
    } else {
      // console.log(
      //   "Unexpected response structure:",
      //   JSON.stringify(response.data, null, 2)
      // );
      return "unknown";
    }
  } catch (error) {
    // console.error("Error fetching call status:", error);
    // if (axios.isAxiosError(error) && error.response) {
    //   console.error(
    //     "Error response:",
    //     JSON.stringify(error.response.data, null, 2)
    //   );
    // }
    return "error";
  }
}

async function initiateCallWithRetry(
  from: string,
  to: string,
  maxAttempts: number = 3
): Promise<void> {
  let attempts = 0;
  let callCompleted = false;

  while (attempts < maxAttempts && !callCompleted) {
    attempts++;
    // console.log(`Attempt ${attempts} of ${maxAttempts}`);

    try {
      const callResponse = await sendCall({ from, to });
      const callSid = callResponse.match(/<Sid>(.*?)<\/Sid>/)?.[1];

      if (!callSid) {
        // console.error("Failed to extract Call SID from response");
        continue;
      }

      // Wait for 15 seconds before checking the call status
      await new Promise((resolve) => setTimeout(resolve, 45000));

      const callStatus = await getCallStatus(callSid);
      // console.log(`Call status: ${callStatus}`);

      if (callStatus === "completed") {
        callCompleted = true;
      } else if (
        callStatus !== "busy" &&
        callStatus !== "no-answer" &&
        callStatus !== "failed"
      ) {
        callCompleted = false;
      }
    } catch (error) {
      // console.error(`Error in attempt ${attempts}:`, error);
    }

    if (!callCompleted && attempts < maxAttempts) {
      // Wait for a short duration before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  if (!callCompleted) {
    // console.log("Max attempts reached without successful call completion");
  }
}

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

    let branch;
    if (selectedLocation.includes("Sevoke Road")) {
      branch = "Sevoke Road";
    } else if (selectedLocation.includes("Dagapur")) {
      branch = "Dagapur";
    } else {
      return res.status(400).json({ message: "Invalid location" });
    }

    const selectedCaller = await db
      .collection("CallData")
      .findOne({ branch, callerStatus: true }, { sort: { dateUpdated: -1 } });

    if (!selectedCaller) {
      return res.status(404).json({ message: "No available caller found" });
    }

    // const callerPhoneNumber = `0${selectedCaller.phoneNumber}`;
    const callerPhoneNumber = `08167443199`;

    await initiateCallWithRetry(
      callerPhoneNumber,
      req.body.customerPhoneNumber
    );

    res.status(200).json({
      message: "Call process completed",
      selectedCaller: {
        name: selectedCaller.name,
        phoneNumber: callerPhoneNumber,
        branch: selectedCaller.branch,
      },
    });
  } catch (error) {
    // console.error("Error in automateCall:", error);
    res.status(500).json({ message: "Error in call automation process" });
  }
}
