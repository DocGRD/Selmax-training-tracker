import type { NextConfig } from "next";

// GitHub Pages serves this repo at /Selmax-training-tracker/ (capital S).
// The path is case-sensitive. assetPrefix is the same path so /_next assets
// resolve on Pages; when assetPrefix is set, Next uses it instead of basePath.
const pagesPath = "/Selmax-training-tracker";

const nextConfig: NextConfig = {
  output: "export",
  basePath: pagesPath,
  assetPrefix: pagesPath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: pagesPath,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
};

export default nextConfig;
