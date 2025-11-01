import { watch, rollup } from './src/bundler/rollup.js';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import progress from 'rollup-plugin-progress';
import path from 'path';

const args = process.argv.slice(2).map(a => a.toLowerCase());
const isDev = args.includes('dev');
const isFast = args.includes('fast');
const isProd = (!isDev && !isFast) || args.includes('prod');

const input = 'src/engine/main.js';
const outDir = path.resolve('dist', 'engine');

const basePlugins = [
  resolve({ 
    browser: true, 
    extensions: ['.js'],
    preferBuiltins: false
  }),
  commonjs({
    sourceMap: false
  }),
  json()
];

if (!isDev && !isFast) {
  basePlugins.push(progress({ clearLine: false }));
}

if (isProd) {
  basePlugins.push(terser({
    format: {
      comments: false,
      ecma: '2015'
    },
    keep_classnames: true,
    keep_fnames: true,
    compress: {
      passes: 2
    }
  }));
}

const baseConfig = {
  input,
  plugins: basePlugins,
  output: {
    dir: outDir,
    format: 'esm',
    name: 'Hawk',
    indent: false,
    sourcemap: false,
    compact: isProd
  },
  cache: true,
  treeshake: isProd ? true : false
};

async function runBuild() {
  try {
    const bundle = await rollup(baseConfig);
    await bundle.write(baseConfig.output);
    await bundle.close();
    process.exit(0);
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

async function runWatch() {
  const watcher = watch({
    ...baseConfig,
    watch: {
      exclude: ['node_modules/**'],
      chokidar: {
        ignoreInitial: true,
        ignorePermissionErrors: true,
        usePolling: false,
        interval: 100,
        binaryInterval: 300,
        awaitWriteFinish: false
      },
      clearScreen: false,
      buildDelay: 0,
      skipWrite: false
    }
  });

  watcher.on('event', event => {
    if (event.code === 'BUNDLE_START') {
      console.log('Bundling engine...');
    } else if (event.code === 'BUNDLE_END') {
      console.log(`Engine build complete in ${event.duration}ms`);
    } else if (event.code === 'ERROR' || event.code === 'FATAL') {
      console.error('Build error:', event.error);
    }
  });

  process.on('SIGINT', async () => {
    await watcher.close();
    process.exit(0);
  });
}

if (isDev) {
  runWatch();
} else {
  runBuild();
}
