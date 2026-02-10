import { EnhancedRepo } from "./types.js";

/**
 * Categorizes a repository based on its detected stack and language.
 * 
 * Categories:
 * - AI & Python Engineering
 * - System & Backend (Go)
 * - Frontend & Fullstack
 * - High Performance & Systems
 * - Other Experiments
 * 
 * @param repo - The enhanced repository data.
 * @returns The category string.
 */
export function categorizeRepo(repo: EnhancedRepo): string {
  const frameworks = repo.stack?.frameworks || [];
  const lang = repo.language;
  
  if (frameworks.includes("Python") || lang === "Python") return "AI & Python Engineering";
  if (frameworks.includes("Go") || lang === "Go") return "System & Backend (Go)";
  if (frameworks.includes("React") || frameworks.includes("Next.js") || lang === "TypeScript") return "Frontend & Fullstack";
  if (lang === "C++" || lang === "C") return "High Performance & Systems";
  
  return "Other Experiments";
}
