import { defineConfig } from 'vite';
import path from 'path';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
    version: string;
};

function gitCommit(): string {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
        return 'unknown';
    }
}

// Detect GitHub Pages base path automatically when building in CI
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
const isCI = !!process.env.GITHUB_ACTIONS;
// Allow overriding base with an absolute URL (e.g., for GitHub Pages) via DEPLOY_BASE
const base =
    process.env.DEPLOY_BASE || (isCI && repoName ? `/${repoName}/` : '/');

const buildMeta = {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(gitCommit()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
};

console.log(
    `Building for ${isCI ? 'GitHub Pages' : 'local development'} with base: ${base}`,
    `— v${pkg.version} @ ${buildMeta.__BUILD_COMMIT__} (${buildMeta.__BUILD_DATE__})`
);

export default defineConfig({
    base,
    define: buildMeta,
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
