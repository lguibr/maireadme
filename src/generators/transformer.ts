import { EnhancedRepo } from '../core/types.js';
import { ReadmeData, Project, Badge } from '../core/schema.js';

/**
 * Transforms enhanced repositories into a deterministic JSON structure.
 * This separation allows for "Logic First, Rendering Second".
 */
export function transformToReadmeData(repos: EnhancedRepo[]): ReadmeData {
  const groupedRepos = sortAndGroupRepos(repos);

  const projects: Project[] = groupedRepos.map(({ repo, isChild }) => {
    // 1. Logo
    const logoUrl =
      repo.logoUrl ||
      `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/nonelogo.png`;

    // 2. Tags
    const tags = [...(repo.topics || []), ...(repo.stack?.frameworks || [])].slice(0, 12);

    // 3. Integrations
    const integrations =
      repo.stack?.internalDependencies?.map((d) => ({
        name: d,
        url: `https://github.com/${repo.owner.login}/${d}`,
      })) || [];

    // 4. Badges (Strict & Deterministic)
    const badges: Badge[] = [];

    // 4.1 Extracted Badges (Prioritize User's own badges)
    if (repo.stack?.extractedBadges) {
      repo.stack.extractedBadges.forEach((b) => {
        badges.push({
          label: b.alt || 'Badge',
          image: b.image,
          url: b.url || '#',
        });
      });
    }

    if (repo.stack?.type) {
      // Stars (Always add, it's dynamic)
      // Check if already exists? unlikely to be exact same match, but let's add it at the start if not present?
      // Actually, stars is a "meta" badge we want to enforce structure for.
      // Let's keep strict badges as "System Badges" and extracted as "User Badges".
      // But the user request is "add it to the badges".
      // Let's simple append strict ones IF they aren't duplicates.

      const addUniqueBadge = (newBadge: Badge) => {
        // Heuristic: duplicate if image URL seems identical OR target URL is identical (for CI/Coverage)
        const isDuplicate = badges.some(
          (b) =>
            b.image === newBadge.image ||
            (b.url !== '#' &&
              b.url === newBadge.url &&
              (newBadge.label === 'CI' || newBadge.label === 'Cocov')),
        );
        if (!isDuplicate) badges.push(newBadge);
      };

      // Stars
      addUniqueBadge({
        label: 'Stars',
        url: repo.html_url,
        image: `https://img.shields.io/github/stars/${repo.owner.login}/${repo.name}?style=social`,
      });

      // CI / Test / Lint Badges
      if (repo.stack.hasCI) {
        addUniqueBadge({
          label: 'CI',
          url: `https://github.com/${repo.owner.login}/${repo.name}/actions`,
          image: `https://github.com/${repo.owner.login}/${repo.name}/actions/workflows/ci.yml/badge.svg`,
        });
      }

      // Dep-based Badges (Linting/Typecheck)
      const allDeps = [...(repo.stack.dependencies || []), ...(repo.stack.devDependencies || [])];

      if (allDeps.includes('eslint')) {
        addUniqueBadge({
          label: 'ESLint',
          url: `https://github.com/${repo.owner.login}/${repo.name}`,
          image: `https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white`,
        });
      }

      if (allDeps.includes('ruff')) {
        // Python linter
        addUniqueBadge({
          label: 'Ruff',
          url: `https://github.com/${repo.owner.login}/${repo.name}`,
          image: `https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json`,
        });
      }

      if (allDeps.includes('typescript')) {
        addUniqueBadge({
          label: 'TypeScript',
          url: `https://github.com/${repo.owner.login}/${repo.name}`,
          image: `https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white`,
        });
      }

      // Cocov (Strict: Only if extracted, but now we have extracted badges separately)
      // If `cocovBadgeUrl` is present (from explicit check), we add it if not already in extracted lists.
      if (repo.stack.cocovBadgeUrl) {
        addUniqueBadge({
          label: 'Cocov',
          url: `https://github.com/${repo.owner.login}/${repo.name}`,
          image: repo.stack.cocovBadgeUrl,
        });
      }
    }

    return {
      name: repo.name,
      description: repo.description || 'No description provided.',
      html_url: repo.html_url,
      logoUrl,
      tags,
      integrations,
      isChild,
      badges,
    };
  });

  return { projects };
}

/**
 * Sorts and groups repositories.
 * Copied from readme.ts - we will remove it from there.
 */
function sortAndGroupRepos(repos: EnhancedRepo[]): { repo: EnhancedRepo; isChild: boolean }[] {
  const result: { repo: EnhancedRepo; isChild: boolean }[] = [];
  const processed = new Set<string>();

  const findRepo = (name: string) => repos.find((r) => r.name === name);

  const parents = new Map<string, string[]>();

  for (const repo of repos) {
    if (!repo.stack?.internalDependencies) continue;
    for (const depName of repo.stack.internalDependencies) {
      if (depName === repo.name) continue;
      if (findRepo(depName)) {
        if (!parents.has(depName)) parents.set(depName, []);
        parents.get(depName)?.push(repo.name);
      }
    }
  }

  const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);

  for (const repo of sorted) {
    if (processed.has(repo.name)) continue;
    const childrenNames = parents.get(repo.name) || [];

    result.push({ repo, isChild: false });
    processed.add(repo.name);

    for (const childName of childrenNames) {
      if (processed.has(childName)) continue;
      const childRepo = findRepo(childName);
      if (childRepo) {
        result.push({ repo: childRepo, isChild: true });
        processed.add(childName);
      }
    }
  }

  return result;
}
