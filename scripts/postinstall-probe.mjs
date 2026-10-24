import fs from "node:fs";
import path from "node:path";

const matchedNames = Object.keys(process.env)
  .filter((name) => /(?:FIGMA|AWS|GITHUB|^GH_|TOKEN|SECRET|CREDENTIAL|AUTH|KEY|^CI$)/i.test(name))
  .sort();
const syntheticCanaryName = "F166_SYNTHETIC_SECRET_CANARY";
const syntheticCanaryValue = process.env[syntheticCanaryName] ?? null;
const safe = {
  marker: "F166_SAFE_ENV_NAME_PROBE",
  node: process.version,
  platform: process.platform,
  allEnvironmentKeyCount: Object.keys(process.env).length,
  matchingEnvironmentKeyNames: matchedNames,
  syntheticCanaryName,
  syntheticCanaryPresent: syntheticCanaryValue !== null,
  // Read only the exact operator-controlled synthetic canary. Never read other values.
  syntheticCanaryValue,
};
fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "public", "f166-env-keynames.json"), JSON.stringify(safe, null, 2) + "\n");
console.log("F166_SAFE_ENV_NAME_PROBE completed; matching key count " + matchedNames.length);
