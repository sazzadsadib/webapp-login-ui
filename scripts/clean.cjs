const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDirectory = path.resolve(projectRoot, 'dist');

if (path.dirname(outputDirectory) !== projectRoot || path.basename(outputDirectory) !== 'dist') {
  throw new Error(`Refusing to remove unexpected output directory: ${outputDirectory}`);
}

fs.rmSync(outputDirectory, { recursive: true, force: true });
