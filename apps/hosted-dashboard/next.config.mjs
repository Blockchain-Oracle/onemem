/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace deps that ship TS/TSX directly (per Next.js 15 workspace conventions)
  transpilePackages: ["@onemem/dashboard", "@onemem/brand"],
  // Keep native/WASM-bearing SDK deps external so Next loads them from
  // node_modules at runtime instead of bundling (fixes walrus_wasm_bg.wasm).
  serverExternalPackages: ["@onemem/sdk-ts", "@mysten/walrus", "@mysten/seal", "@mysten/sui"],
};

export default nextConfig;
