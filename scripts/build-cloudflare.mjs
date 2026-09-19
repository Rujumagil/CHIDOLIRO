import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist-static");
const allowedExtensions = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".txt", ".xml", ".ico", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

async function copyEntry(name) {
  const source = path.join(root, name);
  const info = await stat(source);

  if (info.isDirectory()) {
    if (name === "assets") {
      await cp(source, path.join(out, name), { recursive: true });
    }
    return;
  }

  if (allowedExtensions.has(path.extname(name).toLowerCase())) {
    await cp(source, path.join(out, name));
  }
}

for (const entry of await readdir(root)) {
  if (["api", "cloudflare", "scripts", "dist-static", ".git", ".asset-upload", "node_modules"].includes(entry)) continue;
  if (entry === "package.json") continue;
  await copyEntry(entry);
}

console.log("Prepared Chidoliro static assets in dist-static");
