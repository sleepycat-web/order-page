import { connectToDatabase } from "../../lib/mongodb";

 
 
export const checkUserExists = async (
  phoneNumber: string
): Promise<{ exists: boolean; banStatus: boolean }> => {
    const { db } = await connectToDatabase();
    const collection = db.collection("UserData");
  const user = await collection.findOne({ phoneNumber });
  return {
    exists: !!user,
    banStatus: user?.banStatus || false,
  };
};

export const addNewUser = async (
  phoneNumber: string,
  name: string
): Promise<void> => {
   const { db } = await connectToDatabase();
   const collection = db.collection("UserData");

  // Create a new Date object for the current time in IST
  const now = new Date();
  const istDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  await collection.insertOne({
    phoneNumber,
    name,
    banStatus: false,
    signupDate: istDate,
  });
};

export const getUserData = async (
  phoneNumber: string
): Promise<{ name: string; email?: string; banStatus: boolean }> => {
   const { db } = await connectToDatabase();
   const collection = db.collection("UserData");
  const user = await collection.findOne({ phoneNumber });

  if (user) {
    return {
      name: user.name,
      email: user.email || undefined,
      banStatus: user.banStatus || false,
    };
  }

  throw new Error("User not found");
};
