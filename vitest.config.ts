import { defineConfig, mergeConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: 'jsdom',
            exclude: [...configDefaults.exclude, 'tests/e2e/**'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'html'],
            },
        },
    })
);
