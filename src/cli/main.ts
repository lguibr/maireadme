import chalk from 'chalk';
import fs from 'fs';
import { octokit } from '../api/client.js';
import { detectStackFromRemote } from '../core/analyzer.js';
import { extractDescriptionFromRemote } from '../core/extractor.js';
import { categorizeRepo } from '../core/categorizer.js';
import { generateBadges } from '../generators/badges.js';
import { generateHTML } from '../generators/readme.js';
import { interactiveSelection, promptUsername } from './interactive.js';
import { EnhancedRepo } from '../core/types.js';
import { GithubRepo } from '../api/types.js';

async function fetchRepos(username: string): Promise<GithubRepo[]> {
  console.log(chalk.blue(`Fetching repositories for ${username}...`));
  try {
    const { data } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      sort: 'updated',
      direction: 'desc',
    });
    return data as GithubRepo[];
  } catch (error) {
    console.error(chalk.red('Error fetching repositories:'), error);
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

  const repos = await fetchRepos(username);
  if (repos.length === 0) return console.log(chalk.yellow('No public repositories found.'));

  console.log(chalk.blue(`\nAnalyzing ${repos.length} repositories via GitHub API...`));

  // Enhance repositories
  const allRepoNames = repos.map((r) => r.name);

  const enhancedRepos = await Promise.all(
    repos.map(async (repo, index) => {
      // 1. Stack Detection
      const stack = await detectStackFromRemote(repo, allRepoNames);

      // 2. Enhance Description if needed
      let description = repo.description;
      if (!description || description === repo.name) {
        const remoteDesc = await extractDescriptionFromRemote(repo);
        if (remoteDesc) description = remoteDesc;
      }

      // Simple progress log (since we can't easily do a moving bar with Promise.all without a library)
      process.stdout.write(`.`);

      const enhanced: EnhancedRepo = {
        ...repo,
        stack,
        description,
        logoUrl: stack.logoUrl,
      };

      // 3. Categorize
      enhanced.category = categorizeRepo(enhanced);

      return enhanced;
    }),
  );
  console.log('');

  // Interactive Selection
  const selectedRepos = await interactiveSelection(enhancedRepos);
  if (selectedRepos.length === 0) return console.log(chalk.yellow('No repositories selected.'));

  // 4. Transform to JSON (Deterministic Step)
  console.log(chalk.blue('Transforming data to JSON structure...'));

  // Dynamic import to avoid circular dependencies if any, though here it's fine.
  // Actually, we need to import `transformToReadmeData` at the top.
  // But for this `replace_file_content`, I'll add the logic here and assume imports are added.
  // Wait, I can't add imports easily with `replace_file_content` if they are far away.
  // I will just add the function call here and will add imports in a separate check or use full file replacement if needed.
  // Let's assume I will add imports in a second step or this step if I can match the top.

  // Let's just do the logic part first.
  const { transformToReadmeData } = await import('../generators/transformer.js');
  const readmeData = transformToReadmeData(selectedRepos);

  // Optional: Save JSON for debugging or external use
  const jsonPath = 'maireadme.json';
  fs.writeFileSync(jsonPath, JSON.stringify(readmeData, null, 2));
  console.log(chalk.gray(`Intermediate JSON saved to ${jsonPath}`));

  // 5. Generate Output from JSON
  console.log(chalk.blue('Generating HTML from JSON...'));
  const html = generateHTML(readmeData);

  const outputPath = 'GENERATED_README.md';
  fs.writeFileSync(outputPath, html);
  console.log(chalk.green(`\nSuccess! README.md generated at ${outputPath}`));
}

import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  /* v8 ignore next 3 */
  main().catch((err) => {
    console.error(chalk.red('Fatal Error:'), err);
    process.exit(1);
  });
}
