import styles from "../styles.module.css";

export type PrintDocumentData = {
  documentTitle: string;
  chainName: string;
  tokenAddress: string;
  amount: string;
  contractAddress: string;
  lockId: string;
  hashlock: string;
  unlockDateText: string;
};

export function PrintDocument({
  documentTitle,
  chainName,
  tokenAddress,
  amount,
  contractAddress,
  lockId,
  hashlock,
  unlockDateText,
}: PrintDocumentData) {
  return (
    <div className={styles.printDocument}>
      <h1 className={styles.printTitle}>{documentTitle}</h1>
      <p className={styles.printParagraph}>宛先（受取人）: ________________________________ 様</p>
      <p className={styles.printParagraph}>差出人（預入人）: ________________________________</p>

      <p className={styles.printParagraph}>
        私は、将来の相続に備え、下記の資産をロックし、所定の条件を満たした場合に受取人が請求できるようにしました。
      </p>
      <p className={styles.printParagraph}>
        受取人は、解除日時以降に、秘密の言葉（別紙/口頭/手書きで渡すもの）を用いて請求してください。
      </p>
      <p className={styles.printParagraph}>本書面は、私の意思を示すための参考文書です。</p>

      <h2 className={styles.printSectionTitle}>資産情報</h2>
      <p className={styles.printParagraph}>チェーン: {chainName}</p>
      <p className={styles.printParagraph}>トークン: {tokenAddress}</p>
      <p className={styles.printParagraph}>金額: {amount} USDC</p>

      <h2 className={styles.printSectionTitle}>ロック情報</h2>
      <p className={styles.printParagraph}>コントラクト: {contractAddress}</p>
      <p className={styles.printParagraph}>LockId: {lockId}</p>
      <p className={styles.printParagraph}>Hashlock: {hashlock}</p>
      <p className={styles.printParagraph}>解除日時: {unlockDateText}</p>

      <h2 className={styles.printSectionTitle}>秘密の言葉</h2>
      <p className={styles.printParagraph}>Secret (to be handwritten): ________________________________</p>

      <h2 className={styles.printSectionTitle}>署名</h2>
      <p className={styles.printParagraph}>署名: ________________________________</p>
      <p className={styles.printParagraph}>日付: ________________________________</p>
    </div>
  );
}
