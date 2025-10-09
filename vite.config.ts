import { defineConfig } from 'vite';
import path from 'path';

// Detect GitHub Pages base path automatically when building in CI
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
const isCI = !!process.env.GITHUB_ACTIONS;
// Allow overriding base with an absolute URL (e.g., for GitHub Pages) via DEPLOY_BASE
const base =
    process.env.DEPLOY_BASE || (isCI && repoName ? `/${repoName}/` : '/');

console.log(
    `Building for ${isCI ? 'GitHub Pages' : 'local development'} with base: ${base}`
);

export default defineConfig({
    base,
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, 'src/components'),
            '@core': path.resolve(__dirname, 'src/core'),
            '@middlewares': path.resolve(__dirname, 'src/middlewares'),
            '@routes': path.resolve(__dirname, 'src/routes'),
            '@store': path.resolve(__dirname, 'src/store'),
        },
    },
    build: {
        sourcemap: true,
    },
});
