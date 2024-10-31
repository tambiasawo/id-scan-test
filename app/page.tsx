import Image from "next/image";
import styles from "./page.module.css";
import IdentityVerification from "./_components/ImageCapture";
import Header from "./_components/Header/Header";

export default function Home() {
  return (
    <div>
      <Header />
      <IdentityVerification />
    </div>
  );
}
