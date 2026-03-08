import { Octokit } from "@octokit/rest";
import type { PropertiesData } from "@/types";

const REPO_OWNER = "nickbaf";
const REPO_NAME = "house-hunt-2026";
const DATA_PATH = "data/properties.json";
const BRANCH = "main";

interface FileContent {
  data: PropertiesData;
  sha: string;
}

let octokitInstance: Octokit | null = null;

export function initOctokit(token: string) {
  octokitInstance = new Octokit({ auth: token });
}

function getOctokit(): Octokit {
  if (!octokitInstance) {
    throw new Error("GitHub client not initialized. Please log in first.");
  }
  return octokitInstance;
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.repos.get({ owner: REPO_OWNER, repo: REPO_NAME });
    return true;
  } catch {
    return false;
  }
}

const EMPTY_DATA: PropertiesData = { properties: [], users: [] };

export async function fetchProperties(): Promise<FileContent> {
  const octokit = getOctokit();

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: DATA_PATH,
      ref: BRANCH,
      headers: {
        "If-None-Match": "",
      },
    });

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      throw new Error("Unexpected response format from GitHub API");
    }

    const bytes = Uint8Array.from(atob(data.content), (c) => c.charCodeAt(0));
    const content = new TextDecoder().decode(bytes);
    const parsed: PropertiesData = JSON.parse(content);

    return { data: parsed, sha: data.sha };
  } catch (err: unknown) {
    const is404 =
      err instanceof Error && "status" in err && (err as { status: number }).status === 404;

    if (is404) {
      const sha = await createPropertiesFile(EMPTY_DATA);
      return { data: EMPTY_DATA, sha };
    }
    throw err;
  }
}

async function createPropertiesFile(data: PropertiesData): Promise<string> {
  const octokit = getOctokit();
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

  const { data: result } = await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: DATA_PATH,
    message: "Initialize properties data file",
    content,
    branch: BRANCH,
  });

  return result.content?.sha ?? "";
}

export async function saveProperties(
  newData: PropertiesData,
  currentSha: string,
  commitMessage: string,
): Promise<string> {
  const octokit = getOctokit();
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: DATA_PATH,
    message: commitMessage,
    content,
    sha: currentSha,
    branch: BRANCH,
  });

  return data.content?.sha ?? currentSha;
}

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function saveWithRetry(
  updater: (current: PropertiesData) => PropertiesData,
  commitMessage: string,
): Promise<{ data: PropertiesData; sha: string }> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_BASE_DELAY * attempt);
    }

    const { data: currentData, sha: currentSha } = await fetchProperties();
    const updatedData = updater(currentData);

    try {
      const newSha = await saveProperties(updatedData, currentSha, commitMessage);
      return { data: updatedData, sha: newSha };
    } catch (error: unknown) {
      const isConflict =
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 409;

      if (isConflict && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to save after maximum retries");
}
