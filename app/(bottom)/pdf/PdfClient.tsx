"use client";

import styles from "../styles.module.css";
import { PrintDocument, type PrintDocumentData } from "./PrintDocument";

type Props = {
  data: PrintDocumentData | null;
};

export default function PdfClient({ data }: Props) {
  if (!data) return null;

  return (
    <div className={styles.printOnly}>
      <PrintDocument {...data} />
    </div>
  );
}
