import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { last_name, dob, report_url, fileName, verification_status } =
    await req.json();
  try {
    const response = await fetch(
      `${process.env.WORDPRESS_BASE_API}/save-report/`,
      {
        method: "POST",
        body: JSON.stringify({
          last_name: last_name || "Unknown",
          dob: dob.includes("?") || !dob ? "Unknown" : dob,
          fileName,
          report_url,
          verification_status,
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Optional: Specify that you expect a JSON response
        },
      }
    );
    if (!response.ok) {
      const error = await response.json();

      return NextResponse.json(
        {
          message: error.message || "Something went wrong. Pls try again later",
        },
        { status: response.status || 500 }
      );
    }
    const data = await response.json();
    return NextResponse.json(data); // Return the S3 URL
  } catch (err) {
    console.error("Could not save URL:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
