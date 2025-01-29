import Link from "next/link";

const Custom404 = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        margin: "40px auto",
        maxWidth: "80%",
      }}
    >
      <h1 style={{ color: "red", fontSize: "15px" }}>Oops, Page Not Found!</h1>
      <p style={{ lineHeight: "1.6" }}>
        We are sorry, but the page you&apos;re looking for doesn&apos;t exist,
        or your access token has expired. To get access. you can purchase the product again by
        clicking{" "}
        <Link
          href="https://rented123.com/product/scandit-id-scan/"
          target="_blank"
          className="underline"
        >
          here
        </Link>
      </p>
    </div>
  );
};

export default Custom404;
