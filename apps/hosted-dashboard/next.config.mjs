/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace deps that ship TS/TSX directly (per Next.js 15 workspace conventions)
  transpilePackages: ["@onemem/dashboard", "@onemem/sdk-ts", "@onemem/brand"],
};

export default nextConfig;
