"use client";
import styles from "./Header.module.css";
import Image from "next/image";

const Header = () => {
  return (
    <div className={styles.header}>
      <Image
        src="https://rented123-brand-files.s3.us-west-2.amazonaws.com/logo_white.svg"
        alt="Rented123"
        width={73.75}
        height={100}
      />
    </div>
  );
};

export default Header;
