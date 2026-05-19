/**
 * Vercel Node.js Serverless Function (CommonJS).
 *
 * Forwards every incoming request to the TanStack Start SSR handler
 * pre-bundled by `scripts/bundle-vercel.mjs` into dist/server/bundle.cjs.
 *
 * Vercel includes the bundle alongside this function via the
 * `functions.api/server.js.includeFiles` setting in vercel.json.
 */

const path = require("path");

let serverApp = null;

function getServer() {
  if (!serverApp) {
    const bundlePath = path.join(__dirname, "dist", "server", "bundle.cjs");
    const mod = require(bundlePath);
    serverApp = mod.default ?? mod;
  }
  return serverApp;
}

module.exports = async function handler(request) {
  return getServer().fetch(request);
};
