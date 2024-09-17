{
    "Call": {
        "Sid": "55cd271a8e90cf3f3d9d85e06f56189g",
        "ParentCallSid": "",
        "DateCreated": "2024-09-16 15:50:02",
        "DateUpdated": "2024-09-16 15:50:29",
        "AccountSid": "chaimine1",
        "To": "08167443199",
        "From": "08167443199",
        "PhoneNumberSid": "09513886363",
        "Status": "completed",
        "StartTime": "2024-09-16 15:50:02",
        "EndTime": "2024-09-16 15:50:12",
        "Duration": 11,
        "Price": 0.75,
        "Direction": "outbound-api",
        "AnsweredBy": "human",
        "ForwardedFrom": "",
        "CallerName": "",
        "Uri": "/v1/Accounts/chaimine1/Calls/55cd271a8e90cf3f3d9d85e06f56189g",
        "RecordingUrl": ""
    }
}   


{
    "Call": {
        "Sid": "0f7318af87430ad96e2d1332a5aa189g",
        "ParentCallSid": "",
        "DateCreated": "2024-09-16 15:54:02",
        "DateUpdated": "2024-09-16 15:54:49",
        "AccountSid": "chaimine1",
        "To": "08167443199",
        "From": "08167443199",
        "PhoneNumberSid": "09513886363",
        "Status": "busy",
        "StartTime": "2024-09-16 15:54:02",
        "EndTime": "2024-09-16 15:54:31",
        "Duration": 30,
        "Price": 0,
        "Direction": "outbound-api",
        "AnsweredBy": "human",
        "ForwardedFrom": "",
        "CallerName": "",
        "Uri": "/v1/Accounts/chaimine1/Calls/0f7318af87430ad96e2d1332a5aa189g",
        "RecordingUrl": ""
    }
}

{
    "Call": {
        "Sid": "fe9e9bb3bc5e27386f6c6368a79a189g",
        "ParentCallSid": "",
        "DateCreated": "2024-09-16 15:54:12",
        "DateUpdated": "2024-09-16 15:55:30",
        "AccountSid": "chaimine1",
        "To": "08167443199",
        "From": "08167443199",
        "PhoneNumberSid": "09513886363",
        "Status": "no-answer",
        "StartTime": "2024-09-16 15:54:12",
        "EndTime": "2024-09-16 15:55:11",
        "Duration": 60,
        "Price": 0,
        "Direction": "outbound-api",
        "AnsweredBy": "human",
        "ForwardedFrom": "",
        "CallerName": "",
        "Uri": "/v1/Accounts/chaimine1/Calls/fe9e9bb3bc5e27386f6c6368a79a189g",
        "RecordingUrl": ""
    }
}


import { NextApiRequest, NextApiResponse } from "next"; import { connectToDatabase } from "../../lib/mongodb"; import { sendCall } from "./sendCall"; // Import the sendCall function  export default async function handler(   req: NextApiRequest,   res: NextApiResponse ) {   if (req.method !== "POST") {     return res.status(405).json({ message: "Method Not Allowed" });   }    try {     const { db } = await connectToDatabase();     const { selectedLocation } = req.body;      // Determine the branch based on selectedLocation     let branch;     if (selectedLocation.includes("Sevoke Road")) {       branch = "Sevoke Road";     } else if (selectedLocation.includes("Dagapur")) {       branch = "Dagapur";     } else {       return res.status(400).json({ message: "Invalid location" });     }      // Query the CallData collection for a single document     const selectedCaller = await db       .collection("CallData")       .findOne({ branch, callerStatus: true }, { sort: { dateUpdated: -1 } });      if (!selectedCaller) {       return res.status(404).json({ message: "No available caller found" });     }      // Add a leading "0" to the selected caller's phone number     // const callerPhoneNumber = 0${selectedCaller.phoneNumber};     const callerPhoneNumber = 08167443199 ;      // Call the sendCall function with the required parameters     await sendCall({       from: callerPhoneNumber,       to: req.body.customerPhoneNumber, // Assuming this is provided in the request body     });      res.status(200).json({       message: "Call initiated successfully",       selectedCaller: {         name: selectedCaller.name,         phoneNumber: callerPhoneNumber, // Use the modified phone number here         branch: selectedCaller.branch,       },     });   } catch (error) {     console.error("Error in automateCall:", error);     res.status(500).json({ message: "Error initiating automated call" });   } }  this is my api handler,  
Call response: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<TwilioResponse>\n <Call>\n  <Sid>55cd271a8e90cf3f3d9d85e06f56189g</Sid>\n  <ParentCallSid/>\n  <DateCreated>2024-09-16 15:50:02</DateCreated>\n  <DateUpdated>2024-09-16 15:50:02</DateUpdated>\n  <AccountSid>chaimine1</AccountSid>\n  <To>08167443199</To>\n  <From>08167443199</From>\n  <PhoneNumberSid>09513886363</PhoneNumberSid>\n  <Status>in-progress</Status>\n  <StartTime>2024-09-16 15:50:02</StartTime>\n  <EndTime/>\n  <Duration/>\n  <Price/>\n  <Direction>outbound-api</Direction>\n  <AnsweredBy/>\n  <ForwardedFrom/>\n  <CallerName/>\n  <Uri>/v1/Accounts/chaimine1/Calls/55cd271a8e90cf3f3d9d85e06f56189g</Uri>\n  <RecordingUrl/>\n </Call>\n</TwilioResponse>\n"
 POST /api/automateCall 200 in 1562ms
AutomateCall API called successfully and this is the response, 15s after the response is fetched, i  want the <Sid> of the reponse to be take, and another get request to be made,  to thishttps://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_sid>/Calls/<CallSid>  and  {     "Call": {         "Sid": "55cd271a8e90cf3f3d9d85e06f56189g",         "ParentCallSid": "",         "DateCreated": "2024-09-16 15:50:02",         "DateUpdated": "2024-09-16 15:50:29",         "AccountSid": "chaimine1",         "To": "08167443199",         "From": "08167443199",         "PhoneNumberSid": "09513886363",         "Status": "completed",         "StartTime": "2024-09-16 15:50:02",         "EndTime": "2024-09-16 15:50:12",         "Duration": 11,         "Price": 0.75,         "Direction": "outbound-api",         "AnsweredBy": "human",         "ForwardedFrom": "",         "CallerName": "",         "Uri": "/v1/Accounts/chaimine1/Calls/55cd271a8e90cf3f3d9d85e06f56189g",         "RecordingUrl": ""     } }      {     "Call": {         "Sid": "0f7318af87430ad96e2d1332a5aa189g",         "ParentCallSid": "",         "DateCreated": "2024-09-16 15:54:02",         "DateUpdated": "2024-09-16 15:54:49",         "AccountSid": "chaimine1",         "To": "08167443199",         "From": "08167443199",         "PhoneNumberSid": "09513886363",         "Status": "busy",         "StartTime": "2024-09-16 15:54:02",         "EndTime": "2024-09-16 15:54:31",         "Duration": 30,         "Price": 0,         "Direction": "outbound-api",         "AnsweredBy": "human",         "ForwardedFrom": "",         "CallerName": "",         "Uri": "/v1/Accounts/chaimine1/Calls/0f7318af87430ad96e2d1332a5aa189g",         "RecordingUrl": ""     } }  {     "Call": {         "Sid": "fe9e9bb3bc5e27386f6c6368a79a189g",         "ParentCallSid": "",         "DateCreated": "2024-09-16 15:54:12",         "DateUpdated": "2024-09-16 15:55:30",         "AccountSid": "chaimine1",         "To": "08167443199",         "From": "08167443199