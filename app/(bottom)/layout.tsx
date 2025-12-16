import { BottomLayoutClient } from "./BottomLayoutClient";

export default function BottomLayout({ children }: { children: React.ReactNode }) {
  return <BottomLayoutClient>{children}</BottomLayoutClient>;
}
