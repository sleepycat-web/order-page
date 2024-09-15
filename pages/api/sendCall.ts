import axios from "axios";

interface SendCallParams {
  from: string;
  to: string;
}

export async function sendCall({ from, to }: SendCallParams): Promise<void> {
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
    // const response = await axios.post(url, data, {
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // });

    // // Log the entire response object
    // // console.log("Call response:", JSON.stringify(response.data, null, 2));

    // // You can add any additional processing here if needed

    // return response.data; // Return the response data if you need it in the calling code
  } catch (error) {
    console.error("Error initiating call:", error);
    throw error;
  }
}
