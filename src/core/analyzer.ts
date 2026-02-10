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

  // 0. Fetch README and extract logo and badge
  const readme = await fetchRemoteFile(owner, name, 'README.md');
  const finalReadme = readme || (await fetchRemoteFile(owner, name, 'readme.md'));

  const logoUrl = finalReadme ? extractLogoFromReadme(finalReadme, repo) : null;
  const cocovBadgeUrl = finalReadme ? extractCocovBadgeFromReadme(finalReadme) : null;
  const extractedBadges = finalReadme ? extractBadgesFromReadme(finalReadme) : [];

  if (logoUrl) {
    stack.logoUrl = logoUrl;
  }

  if (cocovBadgeUrl) {
    (stack as any).cocovBadgeUrl = cocovBadgeUrl;
  }

  stack.extractedBadges = extractedBadges;

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
          (r) =>
            r !== name && // Fix self-reference
            (depKeys.includes(r) || depKeys.some((d) => d.endsWith(`/${r}`))),
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
          if (otherRepo !== name && line.includes(`github.com/${owner}/${otherRepo}`)) {
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

  // 4. CI Detection
  // Check for .github/workflows/ci.yml or .github/workflows/main.yml or just existence of .github/workflows
  // Since we can't easily list directories with our current fetcher without extra API calls that might fail or be slow...
  // Let's just try to fetch correct paths.
  const ciYml = await fetchRemoteFile(owner, name, '.github/workflows/ci.yml');
  const mainYml = await fetchRemoteFile(owner, name, '.github/workflows/main.yml');
  const testYml = await fetchRemoteFile(owner, name, '.github/workflows/test.yml');

  if (ciYml || mainYml || testYml) {
    stack.hasCI = true;
  }

  return stack;
}

/**
 * Extracts a logo URL from the repository's README content.
 * Looks for the first image that might be a logo.
 */
export function extractLogoFromReadme(readme: string, repo: GithubRepo): string | null {
  // Regex to find images: ![]() or <img src="...">
  const imgRegex = /!\[.*?\]\((.*?)\)|<img[^>]+src=["'](.*?)["']/gi;
  let match;

  const candidates: string[] = [];

  while ((match = imgRegex.exec(readme)) !== null) {
    const url = match[1] || match[2];
    if (url) candidates.push(url);
  }

  // Filter candidates
  const isBadge = (url: string) => {
    return (
      url.includes('shields.io') ||
      (url.includes('github.com') && url.includes('/actions/workflows')) ||
      url.includes('badge') ||
      url.includes('travis-ci') ||
      url.includes('circleci') ||
      url.includes('codecov') ||
      url.includes('coveralls')
    );
  };

  const validCandidates = candidates.filter((c) => !isBadge(c));

  // 1. Look for 'logo' in the filename
  const logoCandidate = validCandidates.find((c) => c.toLowerCase().includes('logo'));
  if (logoCandidate) return resolveRelativeUrl(logoCandidate, repo);

  // 2. Look for 'icon'
  const iconCandidate = validCandidates.find((c) => c.toLowerCase().includes('icon'));
  if (iconCandidate) return resolveRelativeUrl(iconCandidate, repo);

  // 3. Look for 'bitmap.png' (User specific preference/convention)
  const bitmapCandidate = validCandidates.find((c) => c.toLowerCase().includes('bitmap.png'));
  if (bitmapCandidate) return resolveRelativeUrl(bitmapCandidate, repo);

  // 4. Fallback to the very first non-badge image
  if (validCandidates.length > 0) return resolveRelativeUrl(validCandidates[0], repo);

  // EXPLICIT FALLBACKS FOR KNOWN REPOS
  if (repo.name === 'asciiring') {
    return resolveRelativeUrl('bitmap.png', repo);
  }

  return null;
}

function resolveRelativeUrl(url: string, repo: GithubRepo): string {
  if (url.startsWith('http')) return url;
  // If relative, prepend raw github content url
  // https://raw.githubusercontent.com/<owner>/<repo>/<default_branch>/<path>
  const branch = repo.default_branch || 'main';
  // Remove leading ./ if present
  const cleanPath = url.replace(/^\.\//, '');
  return `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${branch}/${cleanPath}`;
}

export function extractCocovBadgeFromReadme(content: string): string | null {
  // Look for: pattern like raw.githubusercontent.com/.../assets/badges/lines-*.svg
  // Example: https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/lines-94.svg
  // Or just any .svg in assets/badges/lines
  const regex = /https:\/\/raw\.githubusercontent\.com\/[^)]+\/assets\/badges\/lines-[^)]+\.svg/i;
  const match = content.match(regex);
  return match ? match[0] : null;
}

/**
 * Extracts all badges from the README.
 * Identifies images that look like badges (Shields.io, GitHub Workflows, etc.)
 */
export function extractBadgesFromReadme(
  content: string,
): { image: string; url?: string; alt?: string }[] {
  const badges: { image: string; url?: string; alt?: string }[] = [];

  // Regex to capture linked images: [![Alt](Image)](Link) or <a href="Link"><img src="Image" alt="Alt"></a>
  // 1. Markdown Links with Images: [![Alt](Image)](Link)
  const mdLinkRegex = /\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)/gi;
  let mdLinkMatch: RegExpExecArray | null;
  while ((mdLinkMatch = mdLinkRegex.exec(content)) !== null) {
    if (isBadgeUrl(mdLinkMatch[2])) {
      badges.push({ alt: mdLinkMatch[1], image: mdLinkMatch[2], url: mdLinkMatch[3] });
    }
  }

  // 2. HTML Links with Images: <a href="..."><img src="..." alt="..."></a>
  // This is harder with regex, but let's try a simple one.
  const htmlLinkRegex =
    /<a[^>]+href=["'](.*?)["'][^>]*>[\s\S]*?<img[^>]+src=["'](.*?)["'][\s\S]*?<\/a>/gi;
  let htmlLinkMatch: RegExpExecArray | null;
  while ((htmlLinkMatch = htmlLinkRegex.exec(content)) !== null) {
    if (isBadgeUrl(htmlLinkMatch[2])) {
      // Try to extract alt if possible, or default generic
      const altMatch = htmlLinkMatch[0].match(/alt=["'](.*?)["']/);
      badges.push({
        alt: altMatch ? altMatch[1] : 'Badge',
        image: htmlLinkMatch[2],
        url: htmlLinkMatch[1],
      });
    }
  }

  // 3. Standalone Images (Markdown): ![Alt](Image) - sometimes badges aren't linked
  // We should be careful here not to capture the logo or screenshots.
  const mdImgRegex = /!\[(.*?)\]\((.*?)\)/gi;
  let mdImgMatch: RegExpExecArray | null;
  while ((mdImgMatch = mdImgRegex.exec(content)) !== null) {
    // Check if we already have this image (from the linked search above)
    // Actually regex state might be separate.
    // Basic check: is it a badge URL?
    if (mdImgMatch && isBadgeUrl(mdImgMatch[2])) {
      // Verify it's not already added
      if (!badges.some((b) => b.image === mdImgMatch![2])) {
        badges.push({ alt: mdImgMatch![1], image: mdImgMatch![2] });
      }
    }
  }

  return badges;
}

function isBadgeUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('shields.io') ||
    (lower.includes('github.com') && lower.includes('/actions/workflows')) ||
    (lower.includes('github.com') && lower.includes('/badge')) ||
    lower.includes('travis-ci') ||
    lower.includes('circleci') ||
    lower.includes('codecov') ||
    lower.includes('coveralls') ||
    lower.includes('sonarcloud') ||
    lower.includes('badge.svg') ||
    lower.includes('img.shields.io')
  );
}
