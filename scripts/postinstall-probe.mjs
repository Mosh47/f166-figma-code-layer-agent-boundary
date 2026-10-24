import fs from "node:fs";
import path from "node:path";

const matchedNames = Object.keys(process.env)
  .filter((name) => /(?:FIGMA|AWS|GITHUB|^GH_|TOKEN|SECRET|CREDENTIAL|AUTH|KEY|^CI$)/i.test(name))
  .sort();
const safe = {
  marker: "F166_SAFE_ENV_NAME_PROBE",
  node: process.version,
  platform: process.platform,
  allEnvironmentKeyCount: Object.keys(process.env).length,
  matchingEnvironmentKeyNames: matchedNames,
  // Deliberately do not read or emit any environment values.
};
fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), "public", "f166-env-keynames.json"), JSON.stringify(safe, null, 2) + "\n");
console.log("F166_SAFE_ENV_NAME_PROBE completed; matching key count " + matchedNames.length);
