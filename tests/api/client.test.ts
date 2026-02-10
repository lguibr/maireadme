import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Client', () => {
  // Store original token
  const originalToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    // Restore original token state
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original token state
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });

  it('should warn if GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('../../src/api/client.js');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GITHUB_TOKEN not found'));
  });

  it('should not warn if GITHUB_TOKEN is present', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // We already stuck the env, but we need to reload the module to trigger the check
    vi.resetModules();
    await import('../../src/api/client.js');

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
