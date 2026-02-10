import { GithubRepo } from "../api/types.js";
import { fetchRemoteFile } from "../api/fetcher.js";

/**
 * Extracts a meaningful description from the repository's README.md.
 * 
 * It ignores titles, badges, and HTML tags to find the first substantial paragraph.
 * 
 * @param repo - The repository data.
 * @returns A string description or undefined if none found.
 */
export async function extractDescriptionFromRemote(repo: GithubRepo): Promise<string | undefined> {
  const content = await fetchRemoteFile(repo.owner.login, repo.name, "README.md");
  if (!content) return undefined;

  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  /* v8 ignore start */
  if (lines.length === 0) return undefined;
  /* v8 ignore stop */

  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (line.startsWith("[!")) continue; 
    if (line.startsWith("<")) continue;
    if (line.startsWith("http")) continue;
    
    // Heuristic: First substantial line that looks like text (length > 20)
    if (line.length > 20) return line;
  }
  return undefined;
}
