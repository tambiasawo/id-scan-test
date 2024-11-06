// pages/404.js

import Link from "next/link";
//import styles from "./404.module.css"; // Optional: Import CSS module for styling

const Custom404 = () => {
  return (
    <div className={"container"}>
      <h1>404 - Page Not Found</h1>
      <p>
        Sorry, your token has expired or the URL entered is invalid. To access
        the product. Please purchase it again
      </p>
      <Link href="/"> here</Link>
    </div>
  );
};

export default Custom404;
