/** @type {import('next').NextConfig} */

// GitHub Pages: https://Bachhhhhhhhhhhhhh.github.io/excel-arena-BMLG/
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "excel-arena-BMLG";
const basePath = isGithubPages ? `/${repoName}` : "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: isGithubPages ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
