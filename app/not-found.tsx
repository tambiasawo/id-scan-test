
import Link from "next/link";

const Custom404 = () => {
  return (
    <div className={"error-container"}>
      <h1>404 - Page Not Found</h1>
      <p style={{ lineHeight: "1.6" }}>
        We're sorry, but the page you're looking for doesn't exist, or the link
        is invalid. If your access token has expired, you can purchase the
        product again by clicking{" "}
        <Link
          href="https://rented123.com/product/scandit-id-scan/"
          target="_blank"
        >
          here
        </Link>
      </p>
    </div>
  );
};

export default Custom404;
