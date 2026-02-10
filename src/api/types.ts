/**
 * Represents the repository data fetched from GitHub API.
 */
export interface GithubRepo {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  owner: {
    login: string;
  };
}
