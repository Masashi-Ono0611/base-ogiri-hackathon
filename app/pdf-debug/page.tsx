import { PrintDocument } from "../(bottom)/pdf/PrintDocument";
import { toPrintDocumentData } from "../(bottom)/pdf/usePdfModel";
import styles from "../styles/bottom.module.css";

export default function PdfDebugPage() {
  const unlockAtLocal = (() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const data = toPrintDocumentData({
    contractAddress: "0x0000000000000000000000000000000000000000",
    lockId: "0",
    chainName: "",
    tokenAddress: "",
    amount: "0.00001",
    unlockAtLocal,
    hashlock: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });

  return (
    <div className={styles.content}>
      <div className={styles.card}>
        <PrintDocument {...data} />
      </div>
    </div>
  );
}
