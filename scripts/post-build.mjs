import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const configPath = path.join(rootDir, "site.config.json");

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
