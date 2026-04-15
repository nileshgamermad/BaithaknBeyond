import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const configPath = path.join(rootDir, "site.config.json");

const { stories } = await import(pathToFileURL(path.join(rootDir, "src/data/index.js")).href);

const slugifyTag = (tag) => tag.toLowerCase().trim().replace(/\s+/g, "-");

async function loadConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function main() {
  // Ensure .nojekyll exists
  await fs.writeFile(path.join(distDir, ".nojekyll"), "");

  const tagTemplatePath = path.join(distDir, "tags", "index.html");
  const tagTemplate = await fs.readFile(tagTemplatePath, "utf8");
  const tags = [...new Set(stories.flatMap((story) => story.tags || []).map(slugifyTag))];

  for (const tag of tags) {
    const tagDir = path.join(distDir, "tags", tag);
    await fs.mkdir(tagDir, { recursive: true });
    await fs.writeFile(path.join(tagDir, "index.html"), tagTemplate, "utf8");
  }

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
