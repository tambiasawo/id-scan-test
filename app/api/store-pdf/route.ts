import { NextResponse } from "next/server";
import AWS from "aws-sdk";
const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.ACCESS_KEY_SECRET;
const AWS_REGION = process.env.REGION;

export async function POST(req: Request) {
  AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
  });

  const { PDFfile, fileName, verificationPassed } = await req.json();

  // Convert the base64 or other file data to a Buffer
  const pdfBuffer = Buffer.from(PDFfile, "base64"); // Adjust encoding if necessary

  const s3 = new AWS.S3();
  const params = {
    Bucket: verificationPassed
      ? "verified-id-reports"
      : "unverified-id-reports",
    Key: fileName,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  };

  try {
    console.log({ PDFfile, fileName, verificationPassed, AWS_ACCESS_KEY_ID });
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully`);
    return NextResponse.json({ location: data.Location }); // Return the S3 URL
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
