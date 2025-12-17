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

      <h2 className={styles.printSectionTitle}>当事者</h2>
      <p className={styles.printParagraph}>
        贈与者（甲）住所: ________________________________________________
        <br />
        氏名: ________________________________________________
      </p>
      <p className={styles.printParagraph}>
        受贈者（乙）住所: ________________________________________________
        <br />
        氏名: ________________________________________________
      </p>

      <p className={styles.printParagraph}>
        甲および乙は、甲が乙に対して下記の財産を贈与し、乙がこれを受贈することについて合意し、本契約（以下「本契約」という。）を締結する。
      </p>

      <h2 className={styles.printSectionTitle}>第1条（贈与の目的物）</h2>
      <p className={styles.printParagraph}>
        甲は乙に対し、次のデジタル資産相当額を贈与する。
        <br />
        チェーン: {chainName}
        <br />
        トークン（コントラクト）: {tokenAddress}
        <br />
        数量: {amount} USDC
      </p>

      <h2 className={styles.printSectionTitle}>第2条（履行方法・履行期日）</h2>
      <p className={styles.printParagraph}>
        甲は本契約に基づく贈与の履行として、上記目的物相当額を、ハッシュロックおよびタイムロック（以下「ロック」という。）の仕組みを用いてロックし、乙は本書面に記載の解除日時以降、所定の手続に従い請求できるものとする。
        <br />
        解除日時（ロック解除条件の一部）: {unlockDateText}
      </p>

      <h2 className={styles.printSectionTitle}>第3条（秘密の言葉）</h2>
      <p className={styles.printParagraph}>
        乙は、解除日時以降の請求に必要な「秘密の言葉」を、甲から別途受領するものとする。秘密の言葉は、本書面の次の欄に手書きで記入して保管する。
      </p>
      <p className={styles.printParagraph}>秘密の言葉（手書き）: ________________________________________________</p>

      <h2 className={styles.printSectionTitle}>第4条（特記事項：オンチェーン参照情報）</h2>
      <p className={styles.printParagraph}>
        本契約に係るロックの参照情報は次のとおりである。
        <br />
        コントラクト: {contractAddress}
        <br />
        LockId: {lockId}
        <br />
        Hashlock: {hashlock}
      </p>

      <h2 className={styles.printSectionTitle}>第5条（協議）</h2>
      <p className={styles.printParagraph}>
        本契約に定めのない事項または本契約の解釈に疑義が生じた場合は、甲乙誠意をもって協議し解決する。
      </p>

      <h2 className={styles.printSectionTitle}>第6条（合意管轄）</h2>
      <p className={styles.printParagraph}>
        本契約に関して紛争が生じた場合、甲の住所地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とする。
      </p>

      <h2 className={styles.printSectionTitle}>署名押印</h2>
      <p className={styles.printParagraph}>
        本契約締結の証として、本書面を2通作成し、甲乙各1通を保有する。
      </p>
      <p className={styles.printParagraph}>
        契約日: ________年____月____日
        <br />
        贈与者（甲）署名: ________________________________________________  印
        <br />
        受贈者（乙）署名: ________________________________________________  印
      </p>
    </div>
  );
}
