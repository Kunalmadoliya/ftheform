import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  // Use CommonJS because the package has no "type": "module" and Node runs dist/index.js directly.
  format: "cjs",
  // The root package declares Node 18 as its minimum supported runtime.
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  bundle: true,
  treeshake: true,
  // Bundle every JS dependency and these actual workspace package names; Node built-ins remain external.
  noExternal: ["@repo/database", "@repo/logger", "@repo/trpc", "@repo/services", /.*/],
  dts: false,
});
