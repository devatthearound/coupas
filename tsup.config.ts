import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./electron/main/index.ts", "./electron/main/preload.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  cjsInterop: true,
  skipNodeModulesBundle: true,
  treeshake: true,
  outDir: "build",
  external: ["electron", "electron-store"],
  format: ["cjs"],
  bundle: true,
});
