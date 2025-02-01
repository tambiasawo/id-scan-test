import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.ACCESS_KEY_SECRET!;
const AWS_REGION = process.env.REGION!;

export async function POST(req: Request) {
  const { userDetails, recipientEmail, pdfUrl } = await req.json();

  // Initialize SES client
  const ses = new SESClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  const params = {
    Source: "reports@rented123.com",
    Destination: {
      ToAddresses: recipientEmail
        ? ["reports@rented123.com", recipientEmail]
        : ["reports@rented123.com"],
    },
    Message: {
      Subject: {
        Data: `ID Scan Report for ${userDetails.last_name}, ${userDetails.first_name}`,
      },
      Body: {
        Text: {
          Data: `ID Scan Report for ${userDetails.last_name}, ${userDetails.first_name}. You can download your report from this link: ${pdfUrl}`,
        },
        Html: {
          Data: `
            <p>Hi ${userDetails.first_name},</p>
            <p>Congratulations! Your ID has been successfully verified. Click the link below to download the report</p>
            <p>${pdfUrl}</p>
            <br>
            <p>Happy Renting</p>
            <p>The Rented123 Team</p>
          `,
        },
      },
    },
  };

  try {
    // Send email via SES
    const data = await ses.send(new SendEmailCommand(params));
    console.log("Email sent successfully:", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Email sending error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
