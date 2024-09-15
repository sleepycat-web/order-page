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
    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.status === 200) {
      console.log("Call initiated successfully:", response.data);
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error initiating call:", error);
    throw error;
  }
}
