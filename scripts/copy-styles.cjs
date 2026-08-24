const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'src', 'styles.css');
const destination = path.join(projectRoot, 'dist', 'styles.css');
const commonJsManifest = path.join(projectRoot, 'dist', 'cjs', 'package.json');
const esmDirectory = path.join(projectRoot, 'dist', 'esm');

function addEsmExtensions(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      addEsmExtensions(fullPath);
      continue;
    }
    if (!entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts')) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const rewritten = content.replace(
      /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
      (match, start, specifier, end) => /\.[a-z0-9]+$/i.test(specifier) ? match : `${start}${specifier}.js${end}`,
    );
    fs.writeFileSync(fullPath, rewritten, 'utf8');
  }
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
fs.mkdirSync(path.dirname(commonJsManifest), { recursive: true });
fs.writeFileSync(commonJsManifest, '{"type":"commonjs"}\n', 'utf8');
addEsmExtensions(esmDirectory);
