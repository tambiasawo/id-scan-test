import IdentityVerification from "./_components/ImageCapture/ImageCapture";
import Header from "./_components/Header/Header";
import { Suspense } from "react";

export default function Home() {
  return (
    <div style={{ overflowX: "hidden" }}>
      <Header />
      <Suspense>
        <IdentityVerification />
      </Suspense>
    </div>
  );
}
