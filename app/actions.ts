export const getToken = async (token: string) => {
  try {
    if (!token) {
      return null; // Indicate that there’s no valid token
    }

    const response = await fetch(
      `/api/get-token/?token=${encodeURIComponent(token)}`
    );

    if (!response.ok) {
      return null; // Indicate invalid token
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error occurred while fetching token:", error);
    return null; // Return null if an error occurred
  }
};

export const emailPDF = async (
  userDetails: {
    last_name: string;
    first_name: string;
  },
  pdfUrl: string,
  recipientEmail?: string
) => {
  return await fetch("/api/send-email/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userDetails,
      pdfUrl,
      recipientEmail,
    }),
  });
};
