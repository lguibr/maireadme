import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fetcher from '../../src/api/fetcher.js';
import * as categorizer from '../../src/core/categorizer.js';
import * as badges from '../../src/generators/badges.js';
import { extractDescriptionFromRemote } from '../../src/core/extractor.js';
import { EnhancedRepo } from '../../src/core/types.js';
import { GithubRepo } from '../../src/api/types.js';

describe('Hardening: Coverage Gaps', () => {
  const mockRepo: GithubRepo = {
    name: 'gap-repo',
    owner: { login: 'gap-user' },
    html_url: '',
    description: null,
    stargazers_count: 0,
    language: null,
    topics: [],
    default_branch: 'main',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Fetcher: Error Handling (Line 23)
  it('fetchRemoteFile should return undefined on error', async () => {
    // Mock client to throw
    const { octokit } = await import('../../src/api/client.js');
    vi.spyOn(octokit.repos, 'getContent').mockRejectedValue(new Error('API Error'));

    const res = await fetcher.fetchRemoteFile('owner', 'repo', 'path');
    expect(res).toBeUndefined();
  });

  // Categorizer: Default/Unknown (Line 17)
  it('categorizer should fallback to Other Experiments for unknown stack', () => {
    const repo = { ...mockRepo, stack: { type: 'unknown', frameworks: [] } } as any;
    const cat = categorizer.categorizeRepo(repo);
    expect(cat).toBe('Other Experiments');
  });

  it('categorizer should handle missing stack gracefully', () => {
    const repo = { ...mockRepo, stack: undefined } as any;
    const cat = categorizer.categorizeRepo(repo);
    expect(cat).toBe('Other Experiments');
  });

  // Badges: No stack (Line 21)
  it('badges should handle missing stack gracefully', () => {
    const repo = { ...mockRepo, stack: undefined } as any;
    const badgesHtml = badges.generateBadges(repo);
    expect(badgesHtml).toContain('Stars');
    expect(badgesHtml).not.toContain('Python');
  });

  // Badges: Unknown Stack (Line 21)
  it('badges should return empty string if no stack detected', () => {
    const repo = { ...mockRepo, stack: undefined } as any;
    const badgesHtml = badges.generateBadges(repo);
    // It should still contain the stats badge
    expect(badgesHtml).toContain('alt="Stars"');
  });

  // Extractor: Line 17 (Regex loop or branch?)
  // Assuming line 17 is related to filtering or loop
  it('extractor should ignore lines starting with < (HTML)', async () => {
    const readme = `
# Title
<div id="something"></div>
This is a very real description that is definitely longer than twenty characters.
       `;
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue(readme);
    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toBe(
      'This is a very real description that is definitely longer than twenty characters.',
    );
  });

  it('fetcher should return undefined if content is not string or missing', async () => {
    const { octokit } = await import('../../src/api/client.js');
    // Mock successful call but invalid response structure
    vi.spyOn(octokit.repos, 'getContent').mockResolvedValue({
      data: {}, // missing content
    } as any);

    const res = await fetcher.fetchRemoteFile('owner', 'repo', 'path');
    expect(res).toBeUndefined();
  });

  it('analyzer should detect "library" type for minimal dependencies', async () => {
    const { detectStackFromRemote } = await import('../../src/core/analyzer.js');
    vi.spyOn(fetcher, 'fetchRemoteFile').mockImplementation(async (_, __, path) => {
      if (path === 'package.json') {
        return JSON.stringify({ dependencies: { lodash: '1.0' } });
      }
      return undefined;
    });

    const stack = await detectStackFromRemote(mockRepo);
    expect(stack.type).toBe('library');
  });

  it('readme should format tags correctly', async () => {
    const { generateHTML } = await import('../../src/generators/readme.js');
    const project = {
      name: 'gap-repo',
      description: 'Desc',
      html_url: 'https://github.com/u/gap-repo',
      tags: ['t1', 'f1'],
      badges: [],
      isChild: false,
    };

    const html = generateHTML({ projects: [project] });
    expect(html).toContain('<code>t1</code>');
    expect(html).toContain('<code>f1</code>');
  });
});
