import fs from "node:fs";
import path from "node:path";

const CONTROL_OWNER = "Mosh47";
const CONTROL_REPO = "f166-gh-token-isolation-control-20261024";
const CONTROL_FILE = "CONTROLLED_CANARY.txt";
const CONTROL_MARKER = "F166_UNRELATED_PRIVATE_REPO_CANARY_20261024_9A7E2F31C4B8";
const token = process.env.GH_TOKEN || "";

const result = {
  probe: "F166_GITHUB_TOKEN_SCOPE_PROBE_20261024",
  tokenPresent: token.length > 0,
  tokenLengthBucket: token.length === 0 ? "absent" : token.length < 40 ? "short" : token.length < 100 ? "medium" : "long",
  authenticatedUserStatus: null,
  expectedAccount: false,
  unrelatedPrivateRepoStatus: null,
  unrelatedPrivateRepoPermissions: null,
  unrelatedPrivateCanaryStatus: null,
  unrelatedPrivateCanaryReadable: false,
  networkErrorClass: null,
};

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "f166-controlled-figma-token-scope-probe",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function getJson(url) {
  const response = await fetch(url, { headers });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

try {
  if (token) {
    const user = await getJson("https://api.github.com/user");
    result.authenticatedUserStatus = user.response.status;
    result.expectedAccount = user.response.status === 200 && user.body?.login === CONTROL_OWNER;

    const repo = await getJson(`https://api.github.com/repos/${CONTROL_OWNER}/${CONTROL_REPO}`);
    result.unrelatedPrivateRepoStatus = repo.response.status;
    if (repo.response.status === 200) {
      const p = repo.body?.permissions || {};
      result.unrelatedPrivateRepoPermissions = {
        pull: Boolean(p.pull),
        push: Boolean(p.push),
        admin: Boolean(p.admin),
        maintain: Boolean(p.maintain),
        triage: Boolean(p.triage),
      };
    }

    const canary = await getJson(`https://api.github.com/repos/${CONTROL_OWNER}/${CONTROL_REPO}/contents/${CONTROL_FILE}`);
    result.unrelatedPrivateCanaryStatus = canary.response.status;
    if (canary.response.status === 200 && typeof canary.body?.content === "string") {
      const decoded = Buffer.from(canary.body.content.replace(/\\n/g, ""), "base64").toString("utf8").trim();
      result.unrelatedPrivateCanaryReadable = decoded === CONTROL_MARKER;
    }
  }
} catch (error) {
  result.networkErrorClass = error?.name || "Error";
}

fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), "public", "f166-github-token-scope.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  "F166_GITHUB_TOKEN_SCOPE_PROBE completed; " +
  `user_status=${result.authenticatedUserStatus} ` +
  `control_repo_status=${result.unrelatedPrivateRepoStatus} ` +
  `control_canary_readable=${result.unrelatedPrivateCanaryReadable}`,
);
