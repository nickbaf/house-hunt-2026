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

export async function fetchProperties(): Promise<FileContent> {
  const octokit = getOctokit();

  const { data } = await octokit.rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: DATA_PATH,
    ref: BRANCH,
  });

  if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
    throw new Error("Unexpected response format from GitHub API");
  }

  const content = atob(data.content);
  const parsed: PropertiesData = JSON.parse(content);

  return { data: parsed, sha: data.sha };
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

const MAX_RETRIES = 3;

export async function saveWithRetry(
  updater: (current: PropertiesData) => PropertiesData,
  commitMessage: string,
): Promise<{ data: PropertiesData; sha: string }> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
