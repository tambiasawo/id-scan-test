import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

//const AWSInitializer=(service:)
// Load environment variables
const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.ACCESS_KEY_SECRET!;
const AWS_REGION = process.env.REGION!;

export async function POST(req: Request) {
  const { userDetails } = await req.json();

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
      ToAddresses: ["reports@rented123.com"],
    },
    Message: {
      Subject: {
        Data: `ID Scan Report for ${userDetails.last_name}, ${userDetails.first_name}`,
      },
      Body: {
        Text: {
          Data: `ID Scan Report for ${userDetails.last_name}, ${userDetails.first_name}`,
        },
        Html: {
          Data: `
            <h1>Verification Result: Passed</h1>
            <p>Name: <b>${userDetails.last_name}</b>, ${userDetails.first_name}</p>
            <p>Date of Birth: ${userDetails.dob}</p>
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
