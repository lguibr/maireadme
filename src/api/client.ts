import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import chalk from "chalk";

/* v8 ignore start */
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}
/* v8 ignore stop */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.warn(chalk.yellow("Warning: GITHUB_TOKEN not found in .env. API rate limits may apply."));
}

/**
 * Shared Octokit client instance authenticated with GITHUB_TOKEN.
 */
export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});
