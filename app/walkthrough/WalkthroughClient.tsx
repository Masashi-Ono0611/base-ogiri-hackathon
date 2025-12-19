"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import bottomStyles from "../styles/bottom.module.css";
import w from "./walkthrough.module.css";

export default function WalkthroughClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/deposit";

  const steps = useMemo(
    () => [
      {
        title: "1. What is MagoHODL?",
        body: "MagoHODL locks crypto so it cannot be sold early.",
      },
      {
        title: "2. Lock",
        body: "Choose an amount and an unlock time, then lock it.",
      },
      {
        title: "3. Unlock",
        body: "After the time ends, use your secret to unlock and withdraw.",
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const isLast = index === steps.length - 1;
  const progressPct = Math.round(((index + 1) / steps.length) * 100);

  const goNext = () => {
    if (!isLast) {
      setIndex((v) => Math.min(v + 1, steps.length - 1));
      setStepKey((v) => v + 1);
      return;
    }
    router.replace(next);
  };

  const goSkip = () => {
    router.replace("/deposit");
  };

  const goBack = () => {
    setIndex((v) => Math.max(v - 1, 0));
    setStepKey((v) => v + 1);
  };

  return (
    <div className={bottomStyles.container}>
      <main className={bottomStyles.content}>
        <div className={bottomStyles.card}>
          <div className={w.topRow}>
            <div className={w.leftSpacer} aria-hidden />

            <div className={w.logoRowWrap}>
              <Image
                src="/MagoHODL-logo-wide-gray.png"
                alt="MagoHODL"
                fill
                sizes="(max-width: 560px) 70vw, 420px"
                style={{ objectFit: "contain", objectPosition: "center" }}
                priority
              />
            </div>

            <button
              type="button"
              aria-label="Skip"
              className={`${bottomStyles.autoButton} ${w.skipButton}`}
              onClick={goSkip}
            >
              ×
            </button>
          </div>

          <div className={w.progress}>
            <div className={w.progressBar} aria-hidden>
              <div className={w.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div key={stepKey}>
            <h2 className={`${bottomStyles.title} ${w.stepTitle}`}>{steps[index].title}</h2>
            <p className={`${bottomStyles.subtitle} ${bottomStyles.subtitleLarge} ${w.stepBody}`}>{steps[index].body}</p>
          </div>

          <div className={w.actions}>
            <button
              type="button"
              className={`${bottomStyles.button} ${w.secondary} ${w.actionButton}`}
              onClick={goBack}
              disabled={index === 0}
            >
              Back
            </button>

            <button type="button" className={`${bottomStyles.button} ${w.actionButton}`} onClick={goNext}>
              {isLast ? "Start" : "Next"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
