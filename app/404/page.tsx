// pages/404.js

import Link from "next/link";

const Custom404 = () => {
  return (
    <div className={"error-container"}>
      <h1>404 - Page Not Found</h1>
      <p>
        Sorry, your token has expired or the URL entered is invalid. To access
        the product. Please purchase it again{" "}
        <Link href="https://rented123.com/">here</Link>
      </p>
    </div>
  );
};

export default Custom404;
