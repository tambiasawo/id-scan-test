import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { idImage, selfieImage } = await req.json();
  try {
    const response = await fetch(`${process.env.API_TEST_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": process.env.API_KEY_TEST as string,
      },
      body: JSON.stringify({
        document: idImage,
        portrait: selfieImage,
        clientId: process.env.CLIENT_ID as string,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log({ error });
      return NextResponse.json(
        {
          message: error.message || "Something went wrong. Pls try again later",
        },
        { status: response.status || 500 }
      );
    }
    const data = await response.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
