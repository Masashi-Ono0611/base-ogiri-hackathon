"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../styles/bottom.module.css";

const ONBOARDING_COOKIE_KEY = "onboarding_version";
const ONBOARDING_VERSION = "0.1.0";

function setCookie(key: string, value: string) {
  const oneYearSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${oneYearSeconds}; SameSite=Lax`;
}

export default function WalkthroughClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/deposit";

  const steps = useMemo(
    () => [
      {
        title: "Deposit",
        body: "Create a time-locked deposit and generate a printable PDF document.",
      },
      {
        title: "Print",
        body: "After creating a lock, print the PDF and store it safely.",
      },
      {
        title: "Claim",
        body: "Later, claim the deposit using the lock information.",
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;

  const goNext = () => {
    if (!isLast) {
      setIndex((v) => Math.min(v + 1, steps.length - 1));
      return;
    }

    setCookie(ONBOARDING_COOKIE_KEY, ONBOARDING_VERSION);
    router.replace(next);
  };

  const goSkip = () => {
    setCookie(ONBOARDING_COOKIE_KEY, ONBOARDING_VERSION);
    router.replace("/deposit");
  };

  const goBack = () => {
    setIndex((v) => Math.max(v - 1, 0));
  };

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={goSkip}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              color: "inherit",
            }}
          >
            Skip
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ opacity: 0.7, fontSize: 14 }}>{`Step ${index + 1} / ${steps.length}`}</div>
          <h1 style={{ marginTop: 10, fontSize: 24 }}>{steps[index].title}</h1>
          <p style={{ marginTop: 12, lineHeight: 1.6, opacity: 0.9 }}>{steps[index].body}</p>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "12px 14px",
              borderRadius: 10,
              cursor: index === 0 ? "not-allowed" : "pointer",
              color: "inherit",
              opacity: index === 0 ? 0.4 : 1,
            }}
          >
            Back
          </button>

          <button
            type="button"
            onClick={goNext}
            style={{
              flex: 2,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "12px 14px",
              borderRadius: 10,
              cursor: "pointer",
              color: "inherit",
              fontWeight: 600,
            }}
          >
            {isLast ? "Start" : "Next"}
          </button>
        </div>
      </main>
    </div>
  );
}
