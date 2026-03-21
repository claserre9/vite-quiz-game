import page from 'page';
import { registerRoutes } from '@routes/routes';
import './styles/app.css';

// Expose page.js for programmatic navigation in ViewModels (e.g., TrainingViewModel)
;(window as any).page = page;

// Configure page.js base to support deployment under a subpath (e.g., GitHub Pages)
// Vite injects import.meta.env.BASE_URL at build time; it can be a path or an absolute URL
const pageBase = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
const normalizedPageBase =
  pageBase !== '/' ? pageBase.replace(/\/$/, '') : '';

// Avoid setting a base for root deployments. In page.js, using "/" as a base
// changes the initial path matching and breaks direct loads like /quiz/addition.
if (!import.meta.env.DEV && normalizedPageBase) {
  page.base(normalizedPageBase);
}

registerRoutes(page);
