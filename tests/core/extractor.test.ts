import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractDescriptionFromRemote } from '../../src/core/extractor.js';
import * as fetcher from '../../src/api/fetcher.js';
import { GithubRepo } from '../../src/api/types.js';

describe('Extractor', () => {
  const mockRepo: GithubRepo = {
    name: 'test-repo',
    owner: { login: 'user' },
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

  it('should return undefined if README is missing', async () => {
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue(undefined);
    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toBeUndefined();
  });

  it('should extract the first substantial paragraph', async () => {
    const readme = `
# Title
[![Badge](...)]
<div align="center">...</div>

This is a real description that is long enough to be picked up by the extractor heuristic.
 It continues here.
    `;
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue(readme);

    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toContain('This is a real description');
  });

  it('should ignore short lines', async () => {
    const readme = `
# Title
Short.
Too short.
This line is definitely long enough to be considered a proper description of the project.
      `;
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue(readme);
    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toContain('This line is definitely long');
  });

  it('should ignore badges, html, and links', async () => {
    const readme = `
# Title
[!Badge](link)
<div align="center">
https://standalone-link.com
This is the description we want to extract.
    `;
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue(readme);
    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toContain('This is the description we want');
  });
});
