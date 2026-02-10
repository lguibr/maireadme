import { EnhancedRepo } from '../core/types.js';

/**
 * Generates an HTML string of badges for a repository.
 *
 * Includes:
 * - GitHub Stars
 * - Tech Stack Badges (Python, Go, React, Next.js, etc.)
 *
 * @param repo - The enhanced repository data.
 * @returns HTML string containing badges.
 */
export function generateBadges(repo: EnhancedRepo): string {
  const badges: string[] = [];

  // Stars
  badges.push(
    `<a href="${repo.html_url}"><img src="https://img.shields.io/github/stars/${repo.owner.login}/${repo.name}?style=social" alt="Stars"/></a>`,
  );

  const frameworks = repo.stack?.frameworks || [];
  const type = repo.stack?.type;

  // Stack-based badges
  if (frameworks.includes('Python')) {
    badges.push(
      `<img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white" alt="Python"/>`,
    );
  }
  if (frameworks.includes('Go')) {
    badges.push(
      `<img src="https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white" alt="Go"/>`,
    );
  }
  if (type === 'frontend' || frameworks.includes('React')) {
    badges.push(
      `<img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React"/>`,
    );
  }
  if (frameworks.includes('Next.js')) {
    badges.push(
      `<img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js"/>`,
    );
  }
  if (type === 'backend' || frameworks.includes('Express') || frameworks.includes('NestJS')) {
    badges.push(`<img src="https://img.shields.io/badge/Backend-API-green" alt="Backend"/>`);
  }
  if (repo.language === 'TypeScript') {
    badges.push(
      `<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TS"/>`,
    );
  }

  // Cocov Badge
  if (
    repo.stack?.dependencies?.includes('cocov') ||
    repo.stack?.devDependencies?.includes('cocov')
  ) {
    badges.push(
      `<a href="https://cocov.vercel.app/${repo.owner.login}/${repo.name}"><img src="https://cocov.vercel.app/api/badge/${repo.owner.login}/${repo.name}" alt="Cocov"/></a>`,
    );
  }

  return `<div align="center">${badges.join(' ')}</div>`;
}
