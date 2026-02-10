import { GithubRepo } from '../api/types.js';

/**
 * Represents the detected technology stack of a repository.
 */
export interface RepoStack {
  /**
   * High-level type of the project.
   */
  type: 'frontend' | 'backend' | 'fullstack' | 'library' | 'unknown';
  /**
   * List of detecting dependencies (e.g. 'react', 'express').
   */
  dependencies: string[];
  /**
   * List of detected dev dependencies.
   */
  devDependencies?: string[];
  /**
   * List of detected frameworks/languages (e.g. 'Next.js', 'Python').
   */
  frameworks: string[];
  /**
   * Internal dependencies detected within the user's ecosystem.
   */
  internalDependencies?: string[];
  /**
   * Detected logo URL from README.
   */
  logoUrl?: string;
  /**
   * Detected Cocov badge URL from README.
   */
  cocovBadgeUrl?: string;
  /**
   * Indicates if CI/CD is detected (e.g., GitHub Actions, Travis CI).
   */
  hasCI?: boolean;
  /**
   * All badges extracted from the README.
   */
  extractedBadges?: { image: string; url?: string; alt?: string }[];
}

/**
 * Enhanced repository data with analyzed metadata.
 */
export interface EnhancedRepo extends GithubRepo {
  /**
   * Detected technology stack.
   */
  stack?: RepoStack;
  /**
   * Categorization group for the README.
   */
  category?: string;
  /**
   * Detected logo URL from README.
   */
  logoUrl?: string;
}
