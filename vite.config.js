import { defineConfig } from 'vite';
import { resolve } from 'path';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    // 基础配置
    base: isProd ? '/piano-typing-game/' : '/',
    
    // 构建配置
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser'
    },
    
    // 路径别名配置
    resolve: {
        alias: {
            '@css': resolve(__dirname, 'src/css'),
            '/css': resolve(__dirname, 'src/css'),
            '@js': resolve(__dirname, 'src/js'),
            '/js': resolve(__dirname, 'src/js'),
            '@audio': resolve(__dirname, 'public/audio')
        }
    },
    
    // 开发服务器配置
    server: {
        port: 3000,
        open: true,
        cors: true
    }
});