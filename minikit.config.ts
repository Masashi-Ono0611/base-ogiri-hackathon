const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjQ4MzM5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEQxMEIwYTdGQjJkMjI2RDFmYjczNThGYWFhMGY1NDA1Q0U1RDAwNzMifQ",
    payload: "eyJkb21haW4iOiJiYXNlLW9naXJpLWhhY2thdGhvbi52ZXJjZWwuYXBwIn0",
    signature: "lbXdQdCELa02Juk1mwL5MFrVSv+mdoc/7mizfCeakGxqIm6NQVNa564lKJqASN0UVQ4dz6d3xY5ZKXbzcZN0nxw="
  },
  miniapp: {
    version: "1",
    name: "Token Inheritance",
    subtitle: "HTLC Timelock",
    description: "Lock USDC with a hashlock and timelock. Anyone with the secret can claim after unlock.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["base", "usdc", "inheritance", "htlc"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

