import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as interactive from '../../src/cli/interactive.js';
import * as fetcher from '../../src/api/fetcher.js';
import inquirer from 'inquirer';
import { EnhancedRepo } from '../../src/core/types.js';

vi.mock('inquirer');

describe('Interactive CLI', () => {
  const mockRepos: EnhancedRepo[] = [
    { name: 'repo1', stargazers_count: 10, stack: { frameworks: [] }, language: 'TS' } as any,
    { name: 'repo2', stargazers_count: 5, stack: { frameworks: [] }, language: 'JS' } as any,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter selected repositories', async () => {
    // Provide description so it doesn't prompt for it
    const selected = { ...mockRepos[0], description: 'Valid Desc' };

    (inquirer.prompt as any).mockResolvedValueOnce({
      selectedRepos: [selected],
    });

    const result = await interactive.interactiveSelection([selected, mockRepos[1]]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('repo1');
  });

  it('should auto-fill description if missing (prompt disabled)', async () => {
    const reposWithMissingDesc = [
      { name: 'repo1', description: null, stargazers_count: 0, stack: { frameworks: [] } } as any,
    ];

    (inquirer.prompt as any).mockResolvedValueOnce({ selectedRepos: reposWithMissingDesc });

    const result = await interactive.interactiveSelection(reposWithMissingDesc);
    // The current implementation sets it to "No description provided."
    expect(result[0].description).toBe('No description provided.');
  });

  it('should keep original description if user provides empty input (prompt disabled)', async () => {
    const repos = [
      {
        name: 'repo1',
        description: 'repo1', // Triggers "needsInput" check
        stargazers_count: 0,
        stack: { frameworks: [] },
      } as any,
    ];

    (inquirer.prompt as any).mockResolvedValueOnce({ selectedRepos: repos });

    const result = await interactive.interactiveSelection(repos);
    // Logic says: if needsInput, set to 'No description provided.' OR keep original if truthy?
    // Line 38: repo.description = repo.description || 'No description provided.';
    // 'repo1' is truthy, so it stays 'repo1'.
    expect(result[0].description).toBe('repo1');
  });

  it('should prompt for username', async () => {
    (inquirer.prompt as any).mockResolvedValueOnce({ username: 'testuser' });
    const username = await interactive.promptUsername();
    expect(username).toBe('testuser');
  });
});
