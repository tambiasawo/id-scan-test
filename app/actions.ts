export const getToken = async (token: string) => {
  try {
    if (!token) {
      //return NextResponse.redirect(new URL("/404"));
    }

    // Pass the token as a query parameter
    const response = await fetch(
      `/api/get-token/?token=${encodeURIComponent(token)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      /*  if (response.status === 404) {
        return NextResponse.redirect("/404");
      } */
      console.log("Invalid token", errorData.message);
      return undefined;
    } else {
      const responseData = await response.json();
      return responseData;
    }
  } catch (error) {
    console.error("Error occurred while fetching token:", error);
  }
};
