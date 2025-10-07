import page from 'page';
import { registerRoutes } from '@routes/routes';

// Expose page.js for programmatic navigation in ViewModels (e.g., TrainingViewModel)
;(window as any).page = page;

// Configure page.js base to support deployment under a subpath (e.g., GitHub Pages)
// Vite injects import.meta.env.BASE_URL at build time; it can be a path or an absolute URL
const pageBase = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
// Avoid setting page.base during dev to keep clean local routing
if (!import.meta.env.DEV) {
  page.base(pageBase);
}

registerRoutes(page);
