"use client";

import type React from "react";
import Link from "next/link";
import styles from "./styles.module.css";

type Props = {
  isDeposit: boolean;
  isClaim: boolean;
};

type IconProps = React.SVGProps<SVGSVGElement>;

const DepositIcon = (props: IconProps) => (
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
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <rect x="3" y="15" width="18" height="6" rx="2" />
  </svg>
);

const ClaimIcon = (props: IconProps) => (
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
    <path d="M12 3v12" />
    <path d="M8 11l4 4 4-4" />
    <rect x="3" y="15" width="18" height="6" rx="2" />
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
                <DepositIcon className={styles.navIcon} />
                <span>Deposit</span>
              </Link>
            </li>
            <li className={styles.bottomNavItem}>
              <Link
                href="/claim"
                className={`${styles.navLink} ${isClaim ? styles.navLinkActive : ""}`}
                aria-current={isClaim ? "page" : undefined}
              >
                <ClaimIcon className={styles.navIcon} />
                <span>Claim</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
