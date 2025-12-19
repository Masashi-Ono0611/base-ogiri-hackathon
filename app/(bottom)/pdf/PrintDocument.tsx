import styles from "../../styles/bottom.module.css";

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
        数量: {amount} cbBTC
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

      <h2 className={styles.printSectionTitle}>補則（本書面の性質・有効性に関する確認）</h2>
      <p className={styles.printParagraph}>
        1. 本書面は、甲乙間の生前贈与（贈与契約）に関する合意内容を明確化し、後日の紛争予防を目的として作成するものである。
        <br />
        2. 甲乙は、本書面に署名押印（またはこれに準ずる方法）し、契約日および当事者情報を補完することにより、当事者間における合意書面としての効力を持たせる意図であることを相互に確認する。
        <br />
        3. なお、本書面は一般的なひな形であり、個別事情（税務・相続・成年後見・反社会的勢力排除等）に応じて、追加条項や別紙（本人確認資料、資産評価、合意に至る経緯等）を添付することが望ましい。
      </p>

      <h2 className={styles.printSectionTitle}>注意事項（デジタル資産・オンチェーン取引）</h2>
      <p className={styles.printParagraph}>
        1. 本契約の履行はブロックチェーン上の取引（ロック/解除）により行われるため、ネットワーク混雑、手数料（ガス代）、スマートコントラクト仕様、ウォレット操作、秘密情報の管理等に起因して、取引の遅延・失敗・損失が生じ得る。
        <br />
        2. 甲は、乙が請求に必要となる「秘密の言葉」を適切な方法で交付し、乙はこれを第三者に漏えいしないよう厳重に管理する。
        <br />
        3. 本書面に記載のオンチェーン参照情報（コントラクト、LockId、Hashlock 等）は、第三者による検証可能性を高めるためのものであり、実際の権利義務関係は本書面の合意内容に従う。
      </p>

      <h2 className={styles.printSectionTitle}>参考情報（確認方法・参考文献）</h2>
      <p className={styles.printParagraph}>
        1. ブロックチェーン上の取引履歴・コントラクトコードは、ブロックエクスプローラー（例: BaseScan）により公開情報として確認できる。
        <br />
        2. 贈与契約の一般的な法的枠組みについては、民法（贈与に関する規定）および関連する公的解説を参照されたい。
        <br />
        3. 税務上の取扱い（贈与税等）については、国税庁等の公的情報を参照し、必要に応じて税理士等の専門家へ相談すること。
        <br />
        4. 本書面は法的助言を提供するものではなく、個別の事案に対する適法性・有効性・税務上の結論を保証しない。
      </p>
    </div>
  );
}
