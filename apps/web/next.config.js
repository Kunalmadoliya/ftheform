/** @type {import('next').NextConfig} */
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(appDir, "../.."),
};

export default nextConfig;
