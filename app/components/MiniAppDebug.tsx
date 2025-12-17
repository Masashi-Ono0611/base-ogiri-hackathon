"use client";

import styles from "../styles/bottom.module.css";

type Props = {
  show: boolean;
  miniAppSdkReady: string;
  miniAppIsInMiniApp: boolean | null;
  miniAppChains: string[];
  miniAppSdkError: string;
};

export function MiniAppDebug({
  show,
  miniAppSdkReady,
  miniAppIsInMiniApp,
  miniAppChains,
  miniAppSdkError,
}: Props) {
  if (!show) return null;

  return (
    <div className={styles.alert}>
      <div className={styles.alertTitle}>Mini App Debug</div>
      <div className={styles.alertText}>
        SDK: <span className={styles.mono}>{miniAppSdkReady}</span>
      </div>
      <div className={styles.alertText}>
        isInMiniApp:{" "}
        <span className={styles.mono}>{miniAppIsInMiniApp === null ? "null" : String(miniAppIsInMiniApp)}</span>
      </div>
      <div className={styles.alertText}>
        supportedChains:{" "}
        <span className={styles.mono}>
          {Array.isArray(miniAppChains) && miniAppChains.length ? miniAppChains.join(", ") : "(empty)"}
        </span>
      </div>
      {miniAppSdkError && <div className={styles.alertText}>SDK error: {miniAppSdkError}</div>}
    </div>
  );
}
