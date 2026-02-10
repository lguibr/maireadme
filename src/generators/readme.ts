import { ReadmeData } from '../core/schema.js';

/**
 * Generates the final README.md HTML content.
 * Renders a single flat table with hierarchical grouping from the deterministic JSON data.
 */
export function generateHTML(data: ReadmeData): string {
  let html = `<table width="100%">\n`;

  for (const project of data.projects) {
    const { isChild, logoUrl, html_url, name, description, tags, badges, integrations } = project;

    // 1. Tags
    const tagsHtml = tags.map((t) => `<code>${t}</code>`).join(' ');

    // 2. Integrations
    let descHtml = description;
    if (integrations && integrations.length > 0) {
      const links = integrations.map((d) => `<a href="${d.url}">${d.name}</a>`).join(', ');
      descHtml += `<br/><br/><strong>Integrates with:</strong> ${links}`;
    }

    // 3. Badges (Render from JSON data)
    // We construct the HTML from the badge objects.
    const badgesHtml = badges
      .map((b) => `<a href="${b.url}"><img src="${b.image}" alt="${b.label}" /></a>`)
      .join(' ');

    // 4. Layout Logic
    const indentStyle = isChild ? 'padding-left: 40px;' : '';
    const logoHeight = isChild ? '50' : '80';
    const logoMaxWidth = isChild ? '100px' : '160px';
    const rowStyle = isChild ? 'background-color: rgba(0,0,0,0.02);' : '';

    html += `<tr style="border-bottom: none; ${rowStyle}">
<td width="20%" align="center" valign="middle" style="border-right: 1px solid #eee; ${indentStyle}">
  <a href="${html_url}">
    <img src="${logoUrl}" height="${logoHeight}" style="max-width: ${logoMaxWidth}; padding: 10px;" alt="${name} Logo" />
  </a>
</td>
<td width="80%" align="left" valign="top">
  ${badgesHtml}
  <p align="center">
    <strong>${name}</strong>
    <br />
    ${descHtml}
  </p>
  <p align="center">${tagsHtml}</p>
</td>
</tr>`;
  }

  html += `</table>\n`;
  return html;
}
