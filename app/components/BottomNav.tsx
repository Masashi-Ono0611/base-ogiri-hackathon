"use client";

import type React from "react";
import Link from "next/link";
import styles from "../styles/bottom.module.css";

type Props = {
  isDeposit: boolean;
  isClaim: boolean;
};

type IconProps = React.SVGProps<SVGSVGElement>;

const LockIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const UnlockIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="7.5" cy="12" r="3" />
    <path d="M10.5 12h10" />
    <path d="M16 12v2" />
    <path d="M18.5 12v3" />
  </svg>
);

export function BottomNav({ isDeposit, isClaim }: Props) {
  return (
    <nav className={styles.bottomNav} aria-label="Bottom navigation">
      <div className={styles.bottomNavInner}>
        <div className={styles.bottomNavCard}>
          <ul className={styles.bottomNavList}>
            <li className={styles.bottomNavItem}>
              <Link
                href="/deposit"
                className={`${styles.navLink} ${isDeposit ? styles.navLinkActive : ""}`}
                aria-current={isDeposit ? "page" : undefined}
              >
                <LockIcon className={styles.navIcon} />
                <span>Lock</span>
              </Link>
            </li>
            <li className={styles.bottomNavItem}>
              <Link
                href="/claim"
                className={`${styles.navLink} ${isClaim ? styles.navLinkActive : ""}`}
                aria-current={isClaim ? "page" : undefined}
              >
                <UnlockIcon className={styles.navIcon} />
                <span>Unlock</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
