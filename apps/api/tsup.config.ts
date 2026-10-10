import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  // Use CommonJS because the package has no "type": "module" and Node runs dist/index.js directly.
  format: "cjs",
  // The production Docker images run Node 22.
  target: "node22",
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
