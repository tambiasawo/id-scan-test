import IdentityVerification from "./_components/ImageCapture/ImageCapture";
import Header from "./_components/Header/Header";
import { Suspense } from "react";

export default function Home() {
  return (
    <div>
      <Header />
      <Suspense>
        <IdentityVerification />
      </Suspense>
    </div>
  );
}
