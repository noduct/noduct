import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(import.meta.url), '../../');
const hubDist = path.join(rootDir, 'dist');
const mergeDist = path.join(rootDir, 'packages/merge-pdf/dist');
const targetMergeDist = path.join(hubDist, 'merge-pdf');

if (!fs.existsSync(hubDist)) {
  console.error('Error: Hub dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(mergeDist)) {
  console.error('Error: Merge PDF dist directory does not exist. Run "npm run build:merge-pdf" first.');
  process.exit(1);
}

// Copy packages/merge-pdf/dist to dist/merge-pdf
fs.cpSync(mergeDist, targetMergeDist, { recursive: true });

// Verify required entry points
const requiredFiles = [
  path.join(hubDist, 'index.html'),
  path.join(hubDist, 'pt-br/index.html'),
  path.join(hubDist, 'es/index.html'),
  path.join(hubDist, 'data/sponsorships.json'),
  path.join(targetMergeDist, 'index.html'),
  path.join(targetMergeDist, 'pt-br/index.html'),
  path.join(targetMergeDist, 'es/index.html')
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Verification error: Required file missing: ${file}`);
    process.exit(1);
  }
}

console.log('GitHub Pages distribution verified: Hub + Merge PDF entries ready.');

