/* Build Seddo : produit dist/index.html illisible à l'inspection.
   - CSS minifié (csso)
   - JavaScript obfusqué (javascript-obfuscator : identifiants hexadécimaux,
     chaînes encodées en base64 dans un tableau mélangé)
   - HTML minifié (html-minifier-terser)
   Réglages choisis pour NE PAS dégrader les performances mobiles :
   pas de control-flow-flattening ni de dead-code-injection (coûteux à
   l'exécution), uniquement du renommage et de l'encodage de chaînes. */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import obfuscator from 'javascript-obfuscator';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyCss } from 'csso';

const SRC = 'index.html';
const OUT_DIR = 'dist';

let html = readFileSync(SRC, 'utf8');

// 1. CSS
html = html.replace(/<style>([\s\S]*?)<\/style>/, (_, css) =>
  `<style>${minifyCss(css).css}</style>`);

// 2. JavaScript (module principal)
html = html.replace(/<script type="module">([\s\S]*?)<\/script>/, (_, js) => {
  const ob = obfuscator.obfuscate(js, {
    compact: true,
    target: 'browser',
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.85,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    splitStrings: true,
    splitStringsChunkLength: 8,
    // Désactivés exprès : trop coûteux à l'exécution sur mobile
    controlFlowFlattening: false,
    deadCodeInjection: false,
    selfDefending: false,
    debugProtection: false,
    disableConsoleOutput: false, // on garde ?debug fonctionnel
  }).getObfuscatedCode();
  return `<script type="module">${ob}</script>`;
});

// 3. HTML
const finalHtml = await minifyHtml(html, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: false, // déjà fait
  minifyJS: false,  // déjà fait
});

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/index.html`, finalHtml);
copyFileSync('camera-kit.mjs', `${OUT_DIR}/camera-kit.mjs`);

console.log(`Build OK → ${OUT_DIR}/index.html (${finalHtml.length} octets)`);
