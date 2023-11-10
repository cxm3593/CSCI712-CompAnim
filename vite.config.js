import { defineConfig } from 'vite';

export default defineConfig({
    base: '/CSCI712-CompAnim/',
    build: {
        rollupOptions: {
        input: {
            main: './index.html',
            billards: './billards.html',
            fugure: './figure.html',
            // Add other entry points here
        }
        }
    }
});