import { describe, it, expect } from 'vitest';
import { generateBadges } from '../../src/generators/badges.js';
import { EnhancedRepo } from '../../src/core/types.js';

describe('Badge Generator', () => {
  it('should generate stars badge correctly', () => {
    const repo: EnhancedRepo = {
      name: 'test-repo',
      html_url: 'https://github.com/user/test-repo',
      owner: { login: 'user' },
      stack: { frameworks: [], type: 'unknown' }
    } as any;

    const html = generateBadges(repo);
    expect(html).toContain('img.shields.io/github/stars/user/test-repo');
  });

  it('should include Python badge', () => {
    const repo: EnhancedRepo = {
      name: 'python-repo',
      html_url: '...',
      owner: { login: 'user' },
      stack: { frameworks: ['Python'], type: 'backend' }
    } as any;
    expect(generateBadges(repo)).toContain('badge/Python');
  });

  it('should include React badge', () => {
     const repo: EnhancedRepo = {
      name: 'react-repo',
      html_url: '...',
      owner: { login: 'user' },
      stack: { frameworks: ['React'], type: 'frontend' }
    } as any;
    expect(generateBadges(repo)).toContain('badge/React');
  });

  it('should include Next.js badge', () => {
    const repo: EnhancedRepo = {
      name: 'next-repo',
      html_url: '...',
      owner: { login: 'user' },
      stack: { frameworks: ['Next.js'], type: 'frontend' }
    } as any;
    expect(generateBadges(repo)).toContain('badge/Next.js');
 });

 it('should include Backend badge for Express', () => {
    const repo: EnhancedRepo = {
      name: 'node-repo',
      html_url: '...',
      owner: { login: 'user' },
      stack: { frameworks: ['Express'], type: 'backend' }
    } as any;
    expect(generateBadges(repo)).toContain('Backend-API');
 });
 
 it('should include Backend badge for NestJS', () => {
    const repo: EnhancedRepo = {
      name: 'nest-repo',
      html_url: '...',
      owner: { login: 'user' },
      stack: { frameworks: ['NestJS'], type: 'backend' }
    } as any;
    expect(generateBadges(repo)).toContain('Backend-API');
 });

 it('should include TypeScript badge', () => {
    const repo: EnhancedRepo = {
      name: 'ts-repo',
      html_url: '...',
      owner: { login: 'user' },
      language: 'TypeScript',
      stack: { frameworks: [], type: 'library' }
    } as any;
    expect(generateBadges(repo)).toContain('badge/TypeScript');
 });

 it('should include Go badge', () => {
    const repo: EnhancedRepo = {
      name: 'go-repo',
      html_url: '...',
      owner: { login: 'user' },
      stack: { frameworks: ['Go'], type: 'backend' }
    } as any;
    expect(generateBadges(repo)).toContain('badge/Go');
 });
});
