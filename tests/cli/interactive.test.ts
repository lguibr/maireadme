
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as interactive from '../../src/cli/interactive.js';
import * as fetcher from '../../src/api/fetcher.js';
import inquirer from 'inquirer';
import { EnhancedRepo } from '../../src/core/types.js';

vi.mock('inquirer');

describe('Interactive CLI', () => {
  const mockRepos: EnhancedRepo[] = [
    { name: 'repo1', stargazers_count: 10, stack: { frameworks: [] }, language: 'TS' } as any,
    { name: 'repo2', stargazers_count: 5, stack: { frameworks: [] }, language: 'JS' } as any
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter selected repositories', async () => {
    // Provide description so it doesn't prompt for it
    const selected = { ...mockRepos[0], description: 'Valid Desc' };
    
    (inquirer.prompt as any).mockResolvedValueOnce({
      selectedRepos: [selected]
    });

    const result = await interactive.interactiveSelection([selected, mockRepos[1]]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('repo1');
  });

  it('should prompt for description if missing', async () => {
    const reposWithMissingDesc = [
      { name: 'repo1', description: null, stargazers_count: 0, stack: { frameworks: [] } } as any
    ];

    (inquirer.prompt as any)
      .mockResolvedValueOnce({ selectedRepos: reposWithMissingDesc }) // Selection phase
      .mockResolvedValueOnce({ newDesc: 'Custom Description' }); // Description phase

    const result = await interactive.interactiveSelection(reposWithMissingDesc);
    expect(result[0].description).toBe('Custom Description');
  });

  it('should keep original description if user provides empty input', async () => {
    const repos = [
      { name: 'repo1', description: 'Original', stargazers_count: 0, stack: { frameworks: [] } } as any
    ];
    // "Original" is treated as valid, so no prompt? 
    // Wait, let's check the logic: !desc || desc.trim() === "" || desc === repo.name
    // "Original" is valid.
    
    // Let's force a prompt case: description === name
    repos[0].description = 'repo1';

    (inquirer.prompt as any)
      .mockResolvedValueOnce({ selectedRepos: repos })
      .mockResolvedValueOnce({ newDesc: '' });

    const result = await interactive.interactiveSelection(repos);
    expect(result[0].description).toBe('repo1');
  });

  it('should prompt for username', async () => {
    (inquirer.prompt as any).mockResolvedValue({ username: 'testuser' });
    const username = await interactive.promptUsername();
    expect(username).toBe('testuser');
  });
});
