import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

// F166 security fixture. Observe names only, never values or secrets.
const NAME_PATTERN = /(?:FIGMA|AWS|GITHUB|^GH_|TOKEN|SECRET|CREDENTIAL|AUTH|KEY|^CI$)/i;
const matched = Object.keys(process.env).filter((name) => NAME_PATTERN.test(name)).sort();
const marker = {
  probe: "F166_VITE_CONFIG_EVALUATED_20261024",
  node: process.version,
  allEnvironmentKeyCount: Object.keys(process.env).length,
  matchedEnvironmentKeyNames: matched,
};
fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), "public", "f166-vite-config-environment-keys.json"),
  JSON.stringify(marker, null, 2) + "\n",
);
console.log("F166_VITE_CONFIG_EVALUATED_20261024 matched_key_count=" + matched.length);

export default defineConfig({
  plugins: [{
    name: "f166-controlled-environment-name-probe",
    configResolved(config) {
      console.log("F166_VITE_CONFIG_RESOLVED_20261024 mode=" + config.mode);
    },
  }],
});
