import { fetchRemoteFile } from './src/api/fetcher.js';
import { octokit } from './src/api/client.js';

async function run() {
  console.log('Attempting to fetch README.md for lguibr/asciiring...');

  try {
    const content = await fetchRemoteFile('lguibr', 'asciiring', 'README.md');
    console.log(
      'Result for README.md:',
      content ? `Found (${content.length} chars)` : 'Not Found (undefined)',
    );

    if (!content) {
      console.log('Attempting readme.md...');
      const content2 = await fetchRemoteFile('lguibr', 'asciiring', 'readme.md');
      console.log(
        'Result for readme.md:',
        content2 ? `Found (${content2.length} chars)` : 'Not Found (undefined)',
      );
    }

    // Also check default branch
    const { data: repo } = await octokit.repos.get({ owner: 'lguibr', repo: 'asciiring' });
    console.log('Default Branch:', repo.default_branch);
  } catch (err) {
    console.error('Script Error:', err);
  }
}

run();
