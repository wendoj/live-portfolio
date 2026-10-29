import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` writes plain HTML/CSS/JS to out/, which
  // Amplify Hosting serves from its CDN. All dynamic behaviour lives in the
  // browser and the AWS backend, so no Node server is needed.
  output: "export",
  images: {
    // The default image loader needs a server; static export can't use it.
    unoptimized: true,
  },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
