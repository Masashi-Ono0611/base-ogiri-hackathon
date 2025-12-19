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
    name: "MagoHODL",
    subtitle: "Locked Until Your Grandchildren",
    description: "MagoHODL locks crypto so it can only be passed down, not sold.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`], //todo
    iconUrl: `${ROOT_URL}/MagoHODL_icon.png`,
    splashImageUrl: `${ROOT_URL}/MagoHODL_hero_black.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["base", "btc", "inheritance", "htlc"],
    heroImageUrl: `${ROOT_URL}/MagoHODL_hero_black.png`, 
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/MagoHODL_hero_black.png`,
  },
} as const;

