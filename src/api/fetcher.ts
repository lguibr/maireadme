import chalk from "chalk";
import { octokit } from "./client.js";

/**
 * Fetches a raw file content from a GitHub repository.
 * 
 * @param owner - Repository owner (username/org).
 * @param repo - Repository name.
 * @param path - Path to the file in the repository.
 * @returns The decoded file content as a string, or undefined if not found/error.
 */
export async function fetchRemoteFile(owner: string, repo: string, path: string): Promise<string | undefined> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ("content" in data && typeof data.content === "string") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return undefined;
  } catch (error: any) {
    // If 404, file doesn't exist, just return undefined
    if (error.status === 404) return undefined;
    
    // Log other errors but don't crash
    console.error(chalk.red(`Error fetching ${path} for ${repo}: ${error.message}`));
    return undefined;
  }
}
