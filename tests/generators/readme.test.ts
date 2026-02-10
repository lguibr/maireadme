import { describe, it, expect } from 'vitest';
import { generateHTML } from '../../src/generators/readme.js';
import { EnhancedRepo } from '../../src/core/types.js';

describe('README Generator', () => {
  it('should generate empty HTML for no repos', () => {
    const html = generateHTML([]);
    expect(html).toBe('');
  });

  it('should group repositories by category', () => {
    const repos: EnhancedRepo[] = [
      { 
        name: 'ai-repo', 
        category: 'AI & Python Engineering', 
        owner: { login: 'u' }, 
        stack: { frameworks: [] } 
      } as any,
      { 
        name: 'frontend-repo', 
        category: 'Frontend & Fullstack', 
        owner: { login: 'u' }, 
        stack: { frameworks: [] } 
      } as any
    ];

    const html = generateHTML(repos);
    expect(html).toContain('### AI & Python Engineering');
    expect(html).toContain('### Frontend & Fullstack');
    expect(html).toContain('ai-repo');
    expect(html).toContain('frontend-repo');
  });

  it('should handle uncategorized repos as Other Experiments', () => {
    const repos: EnhancedRepo[] = [
      { 
        name: 'misc-repo', 
        category: undefined, 
        owner: { login: 'u' }, 
        stack: { frameworks: [] } 
      } as any
    ];

    const html = generateHTML(repos);
    expect(html).toContain('### Other Experiments');
    expect(html).toContain('misc-repo');
  });

  it('should render default description if missing', () => {
     const repos: EnhancedRepo[] = [
      { 
        name: 'no-desc', 
        description: null, 
        category: 'Other Experiments', 
        owner: { login: 'u' }, 
        stack: { frameworks: [] } 
      } as any
    ];
    const html = generateHTML(repos);
    expect(html).toContain('No description provided.');
  });

  it('should skip category if no repos in it', () => {
      // Create a repo in "AI & Python Engineering"
      // Verify "System & Backend (Go)" header is NOT present
      const repos: EnhancedRepo[] = [
          {
              name: 'py-repo',
              category: 'AI & Python Engineering',
              owner: { login: 'u' },
              stack: { frameworks: [] }
          } as any
      ];
      const html = generateHTML(repos);
      expect(html).toContain('### AI & Python Engineering');
      expect(html).not.toContain('### System & Backend (Go)');
  });

  it('should render internal dependencies', () => {
    const repos: EnhancedRepo[] = [
        {
            name: 'full-repo',
            category: 'Other Experiments',
            owner: { login: 'u' },
            description: 'Desc',
            stack: { 
                frameworks: [], 
                internalDependencies: ['lib-repo'] 
            }
        } as any
    ];
    const html = generateHTML(repos);
    expect(html).toContain('Integrates with:');
    expect(html).toContain('<a href="https://github.com/u/lib-repo">lib-repo</a>');
  });
});
