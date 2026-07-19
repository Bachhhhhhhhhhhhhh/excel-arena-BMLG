/** @type {import('next').NextConfig} */

// GitHub Pages project site: https://<user>.github.io/excel-arena-BMLG/
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "excel-arena-BMLG";

const nextConfig = {
  reactStrictMode: true,
  // Static HTML export for GitHub Pages
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? `/${repoName}` : "",
  },
};

export default nextConfig;
