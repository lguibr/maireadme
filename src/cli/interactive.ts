import inquirer from 'inquirer';
import chalk from 'chalk';
import { GithubRepo } from '../api/types.js';
import { EnhancedRepo } from '../core/types.js';
import { fetchRemoteFile } from '../api/fetcher.js';

/**
 * Prompts the user to select repositories and manually fill in missing descriptions.
 *
 * @param repos - List of fetched repositories.
 * @returns A filtered and enhanced list of repositories.
 */
export async function interactiveSelection(repos: EnhancedRepo[]): Promise<EnhancedRepo[]> {
  const choices = repos.map((repo) => ({
    name: `${repo.name} (${repo.stargazers_count} ⭐) [${repo.stack?.frameworks.join(', ') || repo.language || 'Unknown'}]`,
    value: repo,
    checked: false,
  }));

  const { selectedRepos } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedRepos',
      message: 'Select repositories to include in your portfolio:',
      choices,
      pageSize: 20,
    },
  ]);

  const finalRepos: EnhancedRepo[] = [];

  for (const repo of selectedRepos) {
    const desc = repo.description;
    const needsInput = !desc || desc.trim() === '' || desc === repo.name;

    if (needsInput) {
      // For now, skip prompting to allow batch generation
      repo.description = repo.description || 'No description provided.';
      /*
      console.log(chalk.yellow(`\nMissing description for ${chalk.bold(repo.name)}`));

      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'newDesc',
          message: 'Enter description:',
          default: repo.description || '',
        },
      ]);

      if (answer.newDesc) {
        repo.description = answer.newDesc;
      }
      */
    }
    finalRepos.push(repo);
  }

  return finalRepos;
}

/**
 * Prompts for the GitHub username.
 */
export async function promptUsername(): Promise<string> {
  const { username } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Enter GitHub username:',
      default: 'lguibr',
    },
  ]);
  return username;
}
