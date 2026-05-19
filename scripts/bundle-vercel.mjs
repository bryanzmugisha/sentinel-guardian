/**
 * scripts/bundle-vercel.mjs
 *
 * Run after `vite build` (cloudflare: false).
 * Bundles dist/server/server.js into a single ESM file
 * with react / react-dom left as externals — they live in
 * node_modules on the Vercel host and resolve at runtime.
 */
import { build } from "esbuild";
import { mkdirSync } from "fs";

mkdirSync("dist/server", { recursive: true });

await build({
  entryPoints: ["dist/server/server.js"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/server/bundle.cjs",
  // Keep React external — it's in node_modules on the Vercel host.
  external: ["react", "react-dom", "react/jsx-runtime"],
  logLevel: "warning",
});

console.log("✓ Vercel server bundle → dist/server/bundle.mjs");
