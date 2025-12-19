import { Suspense } from "react";
import WalkthroughClient from "./WalkthroughClient";

export default function WalkthroughPage() {
  return (
    <Suspense fallback={null}>
      <WalkthroughClient />
    </Suspense>
  );
}
