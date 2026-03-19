import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const configPath = path.join(rootDir, 'site.config.json');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function loadConfig() {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function main() {
  // Copy static blog posts
  await copyDir(path.join(rootDir, 'posts'), path.join(distDir, 'posts'));

  // GitHub Pages: disable Jekyll processing
  await fs.writeFile(path.join(distDir, '.nojekyll'), '');

  // Custom domain CNAME
  const { customDomain } = await loadConfig();
  if (typeof customDomain === 'string' && customDomain.trim()) {
    await fs.writeFile(path.join(distDir, 'CNAME'), `${customDomain.trim()}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error('Post-build step failed.');
  console.error(error);
  process.exitCode = 1;
});
