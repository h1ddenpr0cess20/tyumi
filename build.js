import fs from 'fs-extra';
import path from 'path';

const HTML_FILE = 'index.html';
const DIST_DIR = 'dist';
const JS_BUNDLE = path.join(DIST_DIR, 'bundle.js');

async function build() {
  await fs.ensureDir(DIST_DIR);
  const html = await fs.readFile(HTML_FILE, 'utf8');
  const scriptRegex = /<script src="(src\/[^"]+)"><\/script>/g;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  let bundle = '';
  for (const file of scripts) {
    const content = await fs.readFile(file, 'utf8');
    bundle += `\n// ${file}\n${content}\n`;
  }
  await fs.outputFile(JS_BUNDLE, bundle);
  let newHtml = html.replace(scriptRegex, '');
  newHtml = newHtml.replace('</body>', '  <script src="bundle.js"></script>\n</body>');
  await fs.outputFile(path.join(DIST_DIR, 'index.html'), newHtml);
  await fs.copy('src/css', path.join(DIST_DIR, 'css'));
  await fs.copy('src/assets', path.join(DIST_DIR, 'assets'));
  await fs.copy('src/html', path.join(DIST_DIR, 'html'));
  await fs.copy('src/config', path.join(DIST_DIR, 'config'));
  await fs.copy('robots.txt', path.join(DIST_DIR, 'robots.txt')).catch(() => {});
  await fs.copy('sitemap.xml', path.join(DIST_DIR, 'sitemap.xml')).catch(() => {});
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
