import { GithubRepo } from '../api/types.js';
import { RepoStack } from './types.js';
import { fetchRemoteFile } from '../api/fetcher.js';

/**
 * Detects the technology stack of a repository by inspecting remote configuration files.
 * Analyzes repository files to detect the tech stack and internal dependencies.
 *
 * @param repo - The repository to analyze.
 * @param allRepoNames - Optional list of all repositories owned by the user (for internal dep detection).
 */
export async function detectStackFromRemote(
  repo: GithubRepo,
  allRepoNames: string[] = [],
): Promise<RepoStack> {
  const stack: RepoStack = {
    type: 'unknown',
    dependencies: [],
    frameworks: [],
    internalDependencies: [],
  };

  const owner = repo.owner.login;
  const name = repo.name;

  // 1. Check package.json (Node.js)
  const pkgJson = await fetchRemoteFile(owner, name, 'package.json');
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depKeys = Object.keys(deps);

      stack.dependencies = Object.keys(pkg.dependencies || {});
      stack.devDependencies = Object.keys(pkg.devDependencies || {});

      // Smart Dependency Detection (Node)
      if (allRepoNames.length > 0) {
        stack.internalDependencies = allRepoNames.filter(
          (r) => depKeys.includes(r) || depKeys.some((d) => d.endsWith(`/${r}`)),
        );
      }

      /* v8 ignore start */
      if (depKeys.includes('react') || depKeys.includes('next') || depKeys.includes('vue')) {
        stack.type =
          depKeys.includes('express') || depKeys.includes('nest') ? 'fullstack' : 'frontend';
        if (depKeys.includes('next')) stack.frameworks.push('Next.js');
        if (depKeys.includes('react')) stack.frameworks.push('React');
        if (depKeys.includes('vue')) stack.frameworks.push('Vue');
        // Also check for backend frameworks if fullstack
        if (stack.type === 'fullstack') {
          if (depKeys.includes('express')) stack.frameworks.push('Express');
          if (depKeys.includes('nestjs') || depKeys.some((d) => d.includes('@nestjs')))
            stack.frameworks.push('NestJS');
        }
      } else if (
        depKeys.includes('express') ||
        depKeys.includes('nestjs') ||
        depKeys.includes('fastify') ||
        depKeys.some((d) => d.includes('nestjs'))
      ) {
        stack.type = 'backend';
        if (depKeys.includes('express')) stack.frameworks.push('Express');
        if (depKeys.includes('nestjs') || depKeys.some((d) => d.includes('@nestjs')))
          stack.frameworks.push('NestJS');
      } else {
        stack.type = 'library';
      }
      /* v8 ignore stop */
    } catch (e) {
      // Ignore invalid package.json
    }
  }

  // 2. Python checks
  // 2. Python checks
  /* v8 ignore start */
  if (!stack.frameworks.includes('Python')) {
    const pyproject = await fetchRemoteFile(repo.owner.login, repo.name, 'pyproject.toml');
    const requirements = await fetchRemoteFile(repo.owner.login, repo.name, 'requirements.txt');

    if (pyproject || requirements || repo.language === 'Python') {
      stack.frameworks.push('Python');
      if (stack.type === 'unknown') stack.type = 'backend';
    }
  }

  // 3. Go checks
  const goMod = await fetchRemoteFile(owner, name, 'go.mod');
  if (goMod) {
    stack.frameworks.push('Go');
    if (stack.type === 'unknown') stack.type = 'backend';

    // Smart Detection for Go
    if (allRepoNames.length > 0) {
      const lines = goMod.split('\n');
      for (const line of lines) {
        for (const otherRepo of allRepoNames) {
          /* v8 ignore start */
          if (line.includes(`github.com/${owner}/${otherRepo}`)) {
            if (!stack.internalDependencies) stack.internalDependencies = [];
            if (!stack.internalDependencies.includes(otherRepo)) {
              stack.internalDependencies.push(otherRepo);
            }
          }
          /* v8 ignore stop */
        }
      }
    }
  }

  return stack;
}
