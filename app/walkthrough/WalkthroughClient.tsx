"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import bottomStyles from "../styles/bottom.module.css";
import w from "./walkthrough.module.css";

export default function WalkthroughClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/deposit";

  type WalkthroughStep = {
    title: string;
    body: string;
    imageSrc: string;
  };

  const steps = useMemo(
    (): WalkthroughStep[] => [
      {
        title: "What is MagoHODL?",
        body: "A dapp for passing your crypto to your grandchildren. Your crypto are time-locked, so cannot be sold early.",
        imageSrc: "/MagoHODL_step1.png",
      },
      {
        title: "Lock",
        body: "Lock your crypto with a hashlock. We also generate an official document.",
        imageSrc: "/MagoHODL_step2.png",
      },
      {
        title: "Unlock",
        body: "When the time is up, your grandchildren can use the secret to unlock and withdraw your funds.",
        imageSrc: "/MagoHODL_step3.png",
      },
    ],
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const step of steps) {
      const img = new window.Image();
      img.src = step.imageSrc;
    }
  }, [steps]);

  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;

  const goNext = () => {
    if (!isLast) {
      setIndex((v) => Math.min(v + 1, steps.length - 1));
      return;
    }
    router.replace(next);
  };

  const goSkip = () => {
    router.replace("/deposit");
  };

  const goBack = () => {
    setIndex((v) => Math.max(v - 1, 0));
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

          <div className={w.heroWrap}>
            <Image
              src={steps[index].imageSrc}
              alt="MagoHODL"
              fill
              sizes="(max-width: 560px) 92vw, 560px"
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
            />
          </div>

          <div className={w.stepIndicator}>
            {steps.map((_, i) => (
              <span key={i} className={`${w.stepDot} ${i === index ? w.stepDotActive : ""}`} aria-hidden />
            ))}
          </div>

          <div>
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
