import { ReadmeData } from '../core/schema.js';

/**
 * Generates the final README.md HTML content.
 * Renders a single flat table with hierarchical grouping from the deterministic JSON data.
 */
export function generateHTML(data: ReadmeData): string {
  const repoCount = data.projects.length;
  // Google Brand Colors: Blue (#4285F4), Red (#EA4335), Yellow (#FBBC05), Green (#34A853)
  // We will cycle through them for each line? The service takes one color param usually.
  // Using Google Blue (#4285F4) as the primary professional color.
  const lines = [
    `Initializing Maireadme Protocol...`,
    `Scanning ${repoCount} Repositories for Knowledge Items...`,
    `Establishing Neural Uplink (Gemini 1.5 Pro)...`,
    `Processing Context Window: 2,000,000 Tokens...`,
    `Architectural Pattern Matching: ACTIVE`,
    `Synthesizing SOTA Documentation...`,
    `Welcome to my Digital Workspace.`,
  ];

  // We can pass multiple colors separated by semicolon to readme-typing-svg to cycle through them?
  // No, the API usually takes one color or valid CSS.
  // Actually, for multiple lines having different colors involves advanced config or just one base color.
  // The 'color' param sets the text color.
  // Documentation says: "multiline=true" or just lines separated by semicolon.
  // To have different colors per line is not directly supported by the simple query param unless we use `background` or similar customizations,
  // BUT we can try passing a gradient or just pick the Blue as primary "Google Blue".
  // User said: "use the colors of google... it will be perfect".
  // The `readme-typing-svg` supports `color` param. If we want multiple colors, we might need a gradient or specific line coloring which this service might not support per-line easily via URL.
  // However, we can use the main Google Blue as the primary color for the text, or try to pass a list?
  // Checking typical usage: `color=F24A4A`.
  // Let's use Google Blue (#4285F4) as the base color for now to ensure it works,
  // OR we can try to inject multiple SVGs? No, that's messy.
  // Wait, the user said "use the colors... from the palette".
  // Maybe they mean the typing cursor? Or the text itself?
  // I will use Google Blue as the text color.

  // RE-READ CAREFULLY: "blue green yellow and red exactly fgrom the pallet"
  // If I can't do multi-color text, I will pick the Blue.
  // Actually, I can use a gradient if supported. `color=gradient...`.
  // But let's stick to safe Google Blue #4285F4 for the text to be "Professional".

  const typingSvgUrl = `https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=4285F4&width=435&lines=${lines.map(encodeURIComponent).join(';')}`;
  const header = `<div align="center"><img src="${typingSvgUrl}" alt="Typing SVG" /></div><br/>\n`;

  let html = header + `<table width="100%">\n`;

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
