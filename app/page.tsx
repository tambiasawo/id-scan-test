import IdentityVerification from "./_components/ImageCapture/ImageCapture";
import { Suspense } from "react";

export default function Home() {
  return (
    <div style={{ overflowX: "hidden" }} className="font-sans">
      <Suspense>
        <IdentityVerification />
      </Suspense>
    </div>
  );
}
