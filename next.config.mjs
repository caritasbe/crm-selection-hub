/** @type {import('next').NextConfig} */

// Site statique pour GitHub Pages. Le chemin de base est fourni par le workflow de publication
// (ex. /crm-selection-hub) ; vide en local.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
