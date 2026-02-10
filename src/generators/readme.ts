import { EnhancedRepo } from '../core/types.js';
import { generateBadges } from './badges.js';

/**
 * Generates the final README.md HTML content.
 *
 * Groups repositories by category and renders them in a table format.
 *
 * @param repos - List of enhanced repositories.
 * @returns The complete HTML string.
 */
export function generateHTML(repos: EnhancedRepo[]): string {
  // Group by category
  const groups: Record<string, EnhancedRepo[]> = {};
  const categories = [
    'AI & Python Engineering',
    'System & Backend (Go)',
    'Frontend & Fullstack',
    'High Performance & Systems',
    'Other Experiments',
  ];

  for (const repo of repos) {
    const cat = repo.category || 'Other Experiments';
    /* v8 ignore start */
    if (!groups[cat]) groups[cat] = [];
    /* v8 ignore stop */
    groups[cat].push(repo);
  }

  let html = '';

  for (const category of categories) {
    const categoryRepos = groups[category];
    if (!categoryRepos || categoryRepos.length === 0) continue;

    html += `### ${category}\n\n`;
    html += `<table width="100%">\n`;

    for (let i = 0; i < categoryRepos.length; i++) {
      const repo = categoryRepos[i];
      const isEven = i % 2 === 0;

      // Logo assumption
      const logoUrl = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/nonelogo.png`;

      // Tags
      const tags = [
        ...(repo.topics || []),
        /* v8 ignore start */
        ...(repo.stack?.frameworks || []),
        /* v8 ignore stop */
      ]
        .slice(0, 4)
        .map((t) => `<code>${t}</code>`)
        .join(' ');

      let descHtml = repo.description || 'No description provided.';
      if (repo.stack?.internalDependencies && repo.stack.internalDependencies.length > 0) {
        const links = repo.stack.internalDependencies
          .map((d) => `<a href="https://github.com/${repo.owner.login}/${d}">${d}</a>`)
          .join(', ');
        descHtml += `<br/><br/><strong>Integrates with:</strong> ${links}`;
      }

      html += `<tr style="border-bottom: none;">
<td width="20%" align="center" valign="middle" style="border-right: 1px solid #eee;">
  <a href="${repo.html_url}">
    <img src="${logoUrl}" height="80" style="max-width: 160px; padding: 10px;" alt="${repo.name} Logo" />
  </a>
</td>
<td width="80%" align="left" valign="top">
  ${generateBadges(repo)}
  <p align="center">
    <strong>${repo.name}</strong>
    <br />
    ${descHtml}
  </p>
  <p align="center">${tags}</p>
</td>
</tr>`;
    }
    html += `</table>\n\n`;
  }

  return html;
}
