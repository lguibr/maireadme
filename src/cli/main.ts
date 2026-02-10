import chalk from "chalk";
import fs from "fs";
import { octokit } from "../api/client.js";
import { detectStackFromRemote } from "../core/analyzer.js";
import { extractDescriptionFromRemote } from "../core/extractor.js";
import { categorizeRepo } from "../core/categorizer.js";
import { generateBadges } from "../generators/badges.js";
import { generateHTML } from "../generators/readme.js";
import { interactiveSelection, promptUsername } from "./interactive.js";
import { EnhancedRepo } from "../core/types.js";
import { GithubRepo } from "../api/types.js";

async function fetchRepos(username: string): Promise<GithubRepo[]> {
  console.log(chalk.blue(`Fetching repositories for ${username}...`));
  try {
    const { data } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      sort: "updated",
      direction: "desc",
    });
    return data as GithubRepo[];
  } catch (error) {
    console.error(chalk.red("Error fetching repositories:"), error);
    // The original code had process.exit(1) here.
    // The instruction's snippet suggests a restart logic, but it's malformed.
    // For now, keeping the original exit behavior as the snippet is not syntactically valid for insertion here.
    process.exit(1);
  }
}

async function main() {
  try {
    const art = fs.readFileSync(__dirname + '/../ascii-art.txt', 'utf8');
    console.log(chalk.cyan(art));
  } catch (e) {
    // Ignore if art file missing
  }

  const username = await promptUsername();
  
  let repos = await fetchRepos(username);
  if (repos.length === 0) return console.log(chalk.yellow("No public repositories found."));

  console.log(chalk.blue(`\nAnalyzing ${repos.length} repositories via GitHub API...`));
  
  const enhancedRepos: EnhancedRepo[] = [];
  
  // Enhance repositories
  for (const [index, repo] of repos.entries()) {
    process.stdout.write(`\rAnalyzing ${index + 1}/${repos.length}: ${repo.name}          `);
    
    // 1. Stack Detection
    const allRepoNames = repos.map(r => r.name);
    const stack = await detectStackFromRemote(repo, allRepoNames);
    
    // 2. Enhance Description if needed
    let description = repo.description;
    if (!description || description === repo.name) {
       const remoteDesc = await extractDescriptionFromRemote(repo);
       if (remoteDesc) description = remoteDesc;
    }

    const enhanced: EnhancedRepo = {
        ...repo,
        stack,
        description
    };

    // 3. Categorize
    enhanced.category = categorizeRepo(enhanced);
    
    enhancedRepos.push(enhanced);
  }
  console.log("");

  // Interactive Selection
  const selectedRepos = await interactiveSelection(enhancedRepos);
  if (selectedRepos.length === 0) return console.log(chalk.yellow("No repositories selected."));

  // Generate Output
  console.log(chalk.blue("Generating HTML..."));
  const html = generateHTML(selectedRepos);

  const outputPath = "README.md";
  fs.writeFileSync(outputPath, html);
  console.log(chalk.green(`\nSuccess! README.md generated at ${outputPath}`));
}

if (require.main === module) {
  /* v8 ignore next 3 */
  main().catch((err) => {
    console.error(chalk.red("Fatal Error:"), err);
    process.exit(1);
  });
}
