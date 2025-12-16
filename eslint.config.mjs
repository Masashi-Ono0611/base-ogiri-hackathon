import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "artifacts/**",
      "cache/**",
      "typechain-types/**",
    ],
  },
  ...nextConfig,
];

export default config;
