const esbuild = require('esbuild');

async function build() {
    console.log('📦 Building Extension...');

    // Background script - MUST be iife for Chrome service workers
    await esbuild.build({
        entryPoints: ['extension/background.js'],
        bundle: true,
        outfile: 'extension/dist/background.js',
        format: 'iife',
        target: ['chrome100'],
        define: { 'process.env.NODE_ENV': '"production"' }
    });

    // Popup script - can be esm since it's loaded via <script type="module">
    await esbuild.build({
        entryPoints: ['extension/popup.js'],
        bundle: true,
        outfile: 'extension/dist/popup.js',
        format: 'esm',
        target: ['chrome100'],
        define: { 'process.env.NODE_ENV': '"production"' }
    });

    console.log('✅ Build complete! Reload the extension in Chrome.');
}

build().catch((e) => { console.error(e); process.exit(1); });
