import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "fs";
import { createRequire } from "module";

mkdirSync("dist/server", { recursive: true });

// 1. Tiny data bundle (~15 KB) — state + KV, no React, instant cold start
await build({
  entryPoints: ["src/server/data-api.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/server/data-bundle.cjs",
  tsconfig: "tsconfig.json",
  define: { "import.meta.env.SSR": "true" },
  logLevel: "warning",
});
console.log("✓ Data bundle  → dist/server/data-bundle.cjs");

// 2. Full SSR bundle (1.6 MB) — used ONLY to pre-render index.html at build time
await build({
  entryPoints: ["dist/server/server.js"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/server/bundle.cjs",
  external: ["react", "react-dom", "react/jsx-runtime"],
  logLevel: "warning",
});
console.log("✓ SSR bundle   → dist/server/bundle.cjs");

// 3. Pre-render index.html so page loads need zero bundle at runtime
const _require = createRequire(import.meta.url);
try {
  const bundlePath = new URL("../dist/server/bundle.cjs", import.meta.url).pathname;
  const mod = _require(bundlePath);
  const server = mod.default ?? mod;
  const res = await server.fetch(new Request("http://localhost/"));
  const html = await res.text();
  if (html.includes("<!")) {
    writeFileSync("./dist/client/index.html", html);
    console.log("✓ Pre-rendered → dist/client/index.html");
  } else {
    throw new Error("unexpected body: " + html.slice(0, 80));
  }
} catch (e) {
  console.warn("⚠  Pre-render failed:", e.message);
  writeFileSync(
    "./dist/client/index.html",
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>` +
      `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
      `<title>AETERNA OS</title></head><body></body></html>`,
  );
  console.log("✓ Fallback index.html written");
}
