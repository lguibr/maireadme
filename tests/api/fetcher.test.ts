import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fetcher from '../../src/api/fetcher.js';
import { octokit } from '../../src/api/client.js';

// Mock octokit
vi.mock('../../src/api/client.js', () => ({
  octokit: {
    repos: {
      getContent: vi.fn()
    }
  }
}));

describe('Fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return decoded content on success', async () => {
    const mockContent = 'Hello World';
    const base64Content = Buffer.from(mockContent).toString('base64');
    
    (octokit.repos.getContent as any).mockResolvedValue({
      data: {
        content: base64Content
      }
    });

    const result = await fetcher.fetchRemoteFile('user', 'repo', 'file.txt');
    expect(result).toBe(mockContent);
  });

  it('should return undefined on 404', async () => {
    (octokit.repos.getContent as any).mockRejectedValue({
      status: 404
    });

    const result = await fetcher.fetchRemoteFile('user', 'repo', 'missing.txt');
    expect(result).toBeUndefined();
  });

  it('should return undefined and log error on other errors', async () => {
     // Spy on console.error to suppress output during test
     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
     
     (octokit.repos.getContent as any).mockRejectedValue({
       status: 500,
       message: 'Internal Server Error'
     });
 
     const result = await fetcher.fetchRemoteFile('user', 'repo', 'error.txt');
     expect(result).toBeUndefined();
     expect(consoleSpy).toHaveBeenCalled();
  });
});
