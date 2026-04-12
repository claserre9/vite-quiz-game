const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Prepends the Vite base URL to a path so links work under any deployment subpath
 * (e.g. GitHub Pages at /vite-quiz-game/).
 */
export const url = (path: string): string => `${base}${path}`;
