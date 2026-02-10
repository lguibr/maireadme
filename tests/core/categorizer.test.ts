import { describe, it, expect } from 'vitest';
import { categorizeRepo } from '../../src/core/categorizer.js';
import { EnhancedRepo } from '../../src/core/types.js';

describe('Categorizer', () => {
  it('should categorize Python projects correctly', () => {
    const repo: EnhancedRepo = {
      name: 'test-py',
      language: 'Python',
      stack: { frameworks: ['Python'], dependencies: [], type: 'backend' }
    } as any;
    expect(categorizeRepo(repo)).toBe('AI & Python Engineering');
  });

  it('should categorize Go projects correctly', () => {
    const repo: EnhancedRepo = {
      name: 'test-go',
      language: 'Go',
      stack: { frameworks: ['Go'], dependencies: [], type: 'backend' }
    } as any;
    expect(categorizeRepo(repo)).toBe('System & Backend (Go)');
  });

  it('should categorize Frontend/React projects correctly', () => {
    const repo: EnhancedRepo = {
      name: 'test-react',
      language: 'TypeScript',
      stack: { frameworks: ['React', 'Next.js'], dependencies: [], type: 'frontend' }
    } as any;
    expect(categorizeRepo(repo)).toBe('Frontend & Fullstack');
  });

  it('should categorize C++ projects correctly', () => {
    const repo: EnhancedRepo = {
      name: 'test-cpp',
      language: 'C++',
      stack: { frameworks: [], dependencies: [], type: 'unknown' }
    } as any;
    expect(categorizeRepo(repo)).toBe('High Performance & Systems');
  });

  it('should categorize unknown projects as Other Experiments', () => {
    const repo: EnhancedRepo = {
      name: 'test-unknown',
      language: 'Java',
      stack: { frameworks: [], dependencies: [], type: 'unknown' }
    } as any;
    expect(categorizeRepo(repo)).toBe('Other Experiments');
  });
});
