import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

// F166 controlled security probe. It records only whether selected runtime
// credentials are non-empty; it never emits values, lengths, hashes, or prefixes.
const credentialNames = [
  "GH_TOKEN",
  "FIGMA_CONTENT_API_ACCESS_KEY",
  "MCP_PROXY_AUTH_TOKEN",
  "MAKE_VERSION_CREATE_TOKEN",
  "CONTROLLER_TOKEN",
  "DEV_SERVER_TOKEN",
  "FIGARO_PROVIDER_AUTH_TOKEN",
];
const credentialPresence = Object.fromEntries(
  credentialNames.map((name) => [name, typeof process.env[name] === "string" && process.env[name].length > 0]),
);
const marker = {
  probe: "F166_CREDENTIAL_PRESENCE_ONLY_20261024",
  node: process.version,
  platform: process.platform,
  credentialPresence,
};
fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), "public", "f166-credential-presence.json"),
  JSON.stringify(marker, null, 2) + "\n",
);
console.log(
  "F166_CREDENTIAL_PRESENCE_ONLY_20261024 true_count=" +
    Object.values(credentialPresence).filter(Boolean).length,
);

export default defineConfig({});
