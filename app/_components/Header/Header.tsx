"use client";
import styles from "./Header.module.css";

const Header = () => {
  return (
    <div className={styles.header}>
      <img
        src="https://rented123-brand-files.s3.us-west-2.amazonaws.com/logo_white.svg"
        alt="Rented123"
        height="100"
      />
    </div>
  );
};

export default Header;
