"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import bottomStyles from "../styles/bottom.module.css";
import w from "./walkthrough.module.css";
import hero from "../styles/hero.module.css";

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
        title: "Create a Deposit",
        body: "Approve → Lock",
      },
      {
        title: "Print & Store",
        body: "Print → Keep safe",
      },
      {
        title: "Claim When Ready",
        body: "Unlock → Claim",
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

    setCookie(ONBOARDING_COOKIE_KEY, ONBOARDING_VERSION);
    router.replace(next);
  };

  const goSkip = () => {
    setCookie(ONBOARDING_COOKIE_KEY, ONBOARDING_VERSION);
    router.replace("/deposit");
  };

  const goBack = () => {
    setIndex((v) => Math.max(v - 1, 0));
    setStepKey((v) => v + 1);
  };

  return (
    <div className={bottomStyles.container}>
      <main className={bottomStyles.content}>
        <div className={hero.hero}>
          <div className={hero.backdrop} />

          <div className={`${bottomStyles.card} ${hero.card} ${hero.enter}`}>
            <div className={w.topRow}>
              <div className={w.pill}>
                <span className={w.spark} />
                <span>{"Welcome"}</span>
              </div>

              <button type="button" className={bottomStyles.autoButton} onClick={goSkip}>
                Skip
              </button>
            </div>

            <h1 className={`${bottomStyles.title} ${w.heroTitle}`}>
              {"Token Inheritance"}
            </h1>
            <div className={`${bottomStyles.subtitle} ${w.heroSubtitle}`}>{"3 steps."}</div>

            <div className={w.progress}>
              <div className={w.progressBar} aria-hidden>
                <div className={w.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
              <div className={w.progressLabel}>{`Step ${index + 1}/${steps.length}`}</div>
            </div>

            <div className={hero.illustration} aria-hidden>
              <div className={hero.orb} />
              <div className={`${hero.orb} ${hero.orb2}`} />
            </div>

            <div key={stepKey} className={hero.enter}>
              <div className={`${bottomStyles.subtitle} ${w.stepMeta}`}>{`Step ${index + 1}`}</div>
              <h2 className={`${bottomStyles.title} ${w.stepTitle}`}>{steps[index].title}</h2>
              <p className={`${bottomStyles.subtitle} ${w.stepBody}`}>{steps[index].body}</p>
            </div>

            <div className={w.actions}>
              <button
                type="button"
                className={`${bottomStyles.button} ${w.secondary}`}
                onClick={goBack}
                disabled={index === 0}
              >
                Back
              </button>

              <button type="button" className={bottomStyles.button} onClick={goNext}>
                {isLast ? "Start" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
