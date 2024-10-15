import nodemailer from "nodemailer";

interface SendHousefullEmailParams {
  location: string;
}

export async function sendHousefullEmail({
  location,
}: SendHousefullEmailParams): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const formattedLocation = formatLocation(location);

  const emailContent = `
All cabins are currently full at ${formattedLocation}.

Time: ${new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Housefull at ${formattedLocation}`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Housefull email sent for ${formattedLocation}`);
  } catch (error) {
    console.error("Error sending housefull email:", error);
  }
}

function formatLocation(location: string): string {
  if (location.toLowerCase() === "sevoke") {
    return "Sevoke Road";
  }
  return location
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
