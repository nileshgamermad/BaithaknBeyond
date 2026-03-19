import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const configPath = path.join(rootDir, "site.config.json");

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
  // Copy posts/ folder into dist/posts/
  const postsSource = path.join(rootDir, "posts");
  const postsDest = path.join(distDir, "posts");
  await copyEntry(postsSource, postsDest);

  // Ensure .nojekyll exists
  await fs.writeFile(path.join(distDir, ".nojekyll"), "");

  // Write CNAME only if customDomain is set
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
  console.error("Post-build step failed.");
  console.error(error);
  process.exitCode = 1;
});
