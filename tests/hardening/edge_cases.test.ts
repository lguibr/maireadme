import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectStackFromRemote } from '../../src/core/analyzer.js';
import { extractDescriptionFromRemote } from '../../src/core/extractor.js';
import * as fetcher from '../../src/api/fetcher.js';
import { GithubRepo } from '../../src/api/types.js';

describe('Hardening: Edge Cases', () => {
  const mockRepo: GithubRepo = {
    name: 'edge-repo',
    owner: { login: 'edge-user' },
    html_url: '',
    description: null,
    stargazers_count: 0,
    language: null,
    topics: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Analyzer: Deeply nested or circular dependencies (simulated via package.json)
  it('should handle complex mixed stacks', async () => {
    vi.spyOn(fetcher, 'fetchRemoteFile').mockImplementation(async (owner, repo, path) => {
      if (path === 'package.json') {
        return JSON.stringify({
          dependencies: {
            react: '18.0',
            express: '4.18',
            '@nestjs/core': '9.0',
            'my-lib': '1.0',
          },
        });
      }
      return undefined;
    });

    const allRepos = ['my-lib', 'other-repo'];
    const stack = await detectStackFromRemote(mockRepo, allRepos);
    // Should be fullstack because express/nest are present
    expect(stack.type).toBe('fullstack');
    expect(stack.frameworks).toContain('React');
    expect(stack.internalDependencies).toContain('my-lib');
    expect(stack.internalDependencies).not.toContain('other-repo');
    expect(stack.frameworks).toContain('Express');
    expect(stack.frameworks).toContain('NestJS');
  });

  it('should detect Go internal dependencies', async () => {
    vi.spyOn(fetcher, 'fetchRemoteFile').mockImplementation(async (owner, repo, path) => {
      if (path === 'go.mod') {
        return `module github.com/user/repo\nrequire (\n\tgithub.com/edge-user/my-lib v1.0.0\n)`;
      }
      return undefined;
    });

    const allRepos = ['my-lib'];
    const stack = await detectStackFromRemote(mockRepo, allRepos);

    expect(stack.frameworks).toContain('Go');
    expect(stack.internalDependencies).toBeDefined();
    expect(stack.internalDependencies).toContain('my-lib');
  });

  // Extractor: Malformed or Empty READMEs
  it('should handle completely empty README', async () => {
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue('');
    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toBeUndefined();
  });

  it('should handle README with only badges and links', async () => {
    const readme = `
[![Badge](url)]
[![Badge2](url)]
[Link](url)
<img src="..."/>
      `;
    vi.spyOn(fetcher, 'fetchRemoteFile').mockResolvedValue(readme);
    const desc = await extractDescriptionFromRemote(mockRepo);
    expect(desc).toBeUndefined();
  });

  // Analyzer: Malformed JSON responses
  it('should not crash on malformed package.json', async () => {
    vi.spyOn(fetcher, 'fetchRemoteFile').mockImplementation(async (owner, repo, path) => {
      if (path === 'package.json') return '{ "broken": ... ';
      return undefined;
    });
    const stack = await detectStackFromRemote(mockRepo);
    expect(stack.type).toBe('unknown');
  });
});
