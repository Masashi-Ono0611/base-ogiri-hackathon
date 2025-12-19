import styles from "../styles/bottom.module.css";
import { PrintDocument } from "../(bottom)/pdf/PrintDocument";
import { toPrintDocumentData } from "../(bottom)/pdf/usePdfModel";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(searchParams: Props["searchParams"], key: string): string {
  const v = searchParams?.[key];
  if (!v) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

export default function PdfViewPage({ searchParams }: Props) {
  const contractAddress = getParam(searchParams, "contractAddress");
  const lockId = getParam(searchParams, "lockId");
  const chainName = getParam(searchParams, "chainName");
  const tokenAddress = getParam(searchParams, "tokenAddress");
  const amount = getParam(searchParams, "amount");
  const unlockAtLocal = getParam(searchParams, "unlockAtLocal");
  const hashlock = getParam(searchParams, "hashlock");

  const hasRequired = contractAddress && lockId && amount && unlockAtLocal && hashlock;

  return (
    <div className={styles.content}>
      <div className={styles.card}>
        {!hasRequired ? (
          <p className={styles.error}>Missing required parameters.</p>
        ) : (
          <PrintDocument
            {...toPrintDocumentData({
              contractAddress,
              lockId,
              chainName,
              tokenAddress,
              amount,
              unlockAtLocal,
              hashlock,
            })}
          />
        )}
      </div>
    </div>
  );
}
