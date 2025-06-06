import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.ACCESS_KEY_SECRET!;
const AWS_REGION = process.env.REGION!;

export async function POST(req: Request) {
  const { PDFfile, fileName, verificationPassed } = await req.json();

  // Convert the base64 or other file data to a Buffer
  const pdfBuffer = Buffer.from(PDFfile, "base64"); // Adjust encoding if necessary

  const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  const params = {
    Bucket: verificationPassed
      ? "verified-id-reports"
      : "unverified-id-reports",
    Key: fileName,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  };

  try {
    const data = await s3.send(new PutObjectCommand(params));
    console.log("File uploaded successfully:", data);
    return NextResponse.json({
      location: `https://${params.Bucket}.s3.${AWS_REGION}.amazonaws.com/${fileName}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
