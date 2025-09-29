import { watch, rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import progress from 'rollup-plugin-progress';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2).map(a => a.toLowerCase());
const isDev = args.includes('dev');
const isFast = args.includes('fast');
const isProd = (!isDev && !isFast) || args.includes('prod');

const input = 'src/main.js';
const outDir = path.resolve('dist');
const outFile = path.join(outDir, 'hawk.min.js');

const tmpDir = path.resolve('.tmp');
const cacheFile = path.join(tmpDir, 'rollup-cache.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(outDir);
ensureDir(tmpDir);

const basePlugins = [
  resolve({ browser: true, extensions: ['.js'] }),
  commonjs(),
  json(),
  progress({
    clearLine: false
  })
];

const plugins = [...basePlugins];
if (isProd) plugins.push(terser());

const baseConfig = {
  input,
  plugins,
  output: {
    file: outFile,
    format: 'es',
    name: 'Hawk',
  },
  watch: {
    exclude: ['node_modules/**'],
    chokidar: true,
    clearScreen: false
  }
};

let persistedCache = null;
try {
  if (fs.existsSync(cacheFile)) {
    const raw = fs.readFileSync(cacheFile, 'utf8');
    const reviver = (clave, valor) => {
      if (typeof valor === 'string' && /^\d+$/.test(valor) && valor.length > 16) {
        try {
          return BigInt(valor);
        } catch (e) {
          return valor;
        }
      }
      return valor;
    };
    persistedCache = JSON.parse(raw, reviver);
    console.log('Loaded rollup cache from', cacheFile);
  }
} catch (err) {
  console.warn('Could not read rollup cache:', err.message);
  persistedCache = null;
}

async function persistCache(cacheObj) {
  try {
    const replacer = (key, val) => {
      if (typeof val === 'function') return undefined;
      if (typeof val === 'bigint') return val.toString();
      return val;
    };
    fs.writeFileSync(cacheFile, JSON.stringify(cacheObj, replacer), 'utf8');
  } catch (err) {
    console.warn('Failed to save rollup cache:', err.message);
  }
}

if (isDev) {
  console.log('Mode: DEV');

  const watchConfig = Object.assign({}, baseConfig);
  if (persistedCache) watchConfig.cache = persistedCache;

  const watcher = watch(watchConfig);
  watcher.on('event', async event => {
    const t = new Date().toLocaleTimeString();
    if (event.code === 'BUNDLE_START') console.log(`[${t}] Bundling...`);
    else if (event.code === 'BUNDLE_END') {
      console.log(`[${t}] Build complete: ${path.relative(process.cwd(), outFile)} (${event.duration || 0}ms)`);
      if (event.result && event.result.cache) {
        await persistCache(event.result.cache);
      }
    } else if (event.code === 'ERROR' || event.code === 'FATAL') {
      console.error(`[${t}] Build error:`, event.error);
    }
  });

  process.on('SIGINT', async () => { console.log('\nClosing watcher...'); await watcher.close(); process.exit(0); });

} else if (isFast) {
  console.log('Mode: FAST');

  (async () => {
    try {
      const bundle = await rollup({
        input,
        plugins,
        cache: persistedCache || undefined
      });
      await bundle.write(baseConfig.output);
      if (bundle.cache) await persistCache(bundle.cache);
      console.log('Fast build complete:', path.relative(process.cwd(), outFile));
      await bundle.close();
      process.exit(0);
    } catch (err) {
      console.error('Fast build error:', err);
      process.exit(1);
    }
  })();

} else {
  console.log('Mode: PROD');
  (async () => {
    try {
      const bundle = await rollup({
        input,
        plugins,
        cache: persistedCache || undefined
      });
      await bundle.write(baseConfig.output);
      if (bundle.cache) await persistCache(bundle.cache);
      console.log('Build complete:', path.relative(process.cwd(), outFile));
      await bundle.close();
      process.exit(0);
    } catch (err) {
      console.error('Build error:', err);
      process.exit(1);
    }
  })();
}
