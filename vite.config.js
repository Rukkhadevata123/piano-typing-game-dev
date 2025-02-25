import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // 动态设置 base：开发时为 '/'，生产时为 '/piano-typing-game/'
    base: process.env.NODE_ENV === 'production' ? '/piano-typing-game/' : '/',
    // 定义全局变量，用于 JS 中动态路径
    define: {
        'import.meta.env.BASE_URL': JSON.stringify(
            process.env.NODE_ENV === 'production' ? '/piano-typing-game/' : '/'
        ),
    },
    // 指定构建输出目录
    build: {
        outDir: 'dist',
        assetsDir: 'assets', // 静态资源存放目录
        // 添加构建优化选项
        minify: 'terser',

    },
    // 可选：添加路径别名，简化导入
    resolve: {
        alias: {
            '@css': resolve(__dirname, 'src/css'),
            '/css': resolve(__dirname, 'src/css'),
            '@js': resolve(__dirname, 'src/js'),
            '/js': resolve(__dirname, 'src/js'),
            '@audio': resolve(__dirname, 'public/audio')
        }
    },
    server: {
        port: 3000,
        open: true,
        cors: true
    }
});