import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const configPath = path.join(rootDir, "site.config.json");

const excludedNames = new Set([
  ".git",
  ".github",
  ".claude",
  "dist",
  "node_modules",
  "scripts",
  "package.json",
  "package-lock.json",
  "site.config.json",
  ".gitignore",
  "AGENTS.md",
]);

async function emptyDir(targetDir) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
}

async function copyEntry(sourcePath, destinationPath) {
  const stats = await fs.stat(sourcePath);

  if (stats.isDirectory()) {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(sourcePath);

    for (const entry of entries) {
      await copyEntry(
        path.join(sourcePath, entry),
        path.join(destinationPath, entry)
      );
    }

    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
}

async function loadConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function main() {
  await emptyDir(distDir);

  const rootEntries = await fs.readdir(rootDir);

  for (const entry of rootEntries) {
    if (excludedNames.has(entry)) {
      continue;
    }

    const sourcePath = path.join(rootDir, entry);
    const destinationPath = path.join(distDir, entry);

    await copyEntry(sourcePath, destinationPath);
  }

  await fs.writeFile(path.join(distDir, ".nojekyll"), "");

  const { customDomain } = await loadConfig();

  if (typeof customDomain === "string" && customDomain.trim()) {
    await fs.writeFile(
      path.join(distDir, "CNAME"),
      `${customDomain.trim()}\n`,
      "utf8"
    );
  }
}

main().catch((error) => {
  console.error("Failed to prepare GitHub Pages build.");
  console.error(error);
  process.exitCode = 1;
});
