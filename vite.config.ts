import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
