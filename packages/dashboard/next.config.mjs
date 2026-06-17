/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // The SDK pulls in @mysten/walrus (ships a sibling .wasm). Keep these as
  // node-resolved externals so the wasm asset loads from node_modules instead of
  // being (incorrectly) bundled into the server output.
  serverExternalPackages: ["@onemem/sdk-ts", "@mysten/walrus", "@mysten/sui"],
};

export default nextConfig;
