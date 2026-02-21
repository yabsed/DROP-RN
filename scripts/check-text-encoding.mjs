import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md"]);
const ignoreDirs = new Set([
  ".git",
  "node_modules",
  ".expo",
  "android",
  "ios",
  "dist",
  "build",
  "coverage",
]);

const suspiciousRanges = /[\uF900-\uFAFF\uFFFD]/u;
const suspiciousMojibakePattern = /\?[가-힣]/u;

const failures = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      walk(full);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!includeExt.has(ext)) continue;

    const raw = fs.readFileSync(full);
    const text = raw.toString("utf8");
    const roundTrip = Buffer.from(text, "utf8");

    if (!raw.equals(roundTrip)) {
      failures.push(`${rel}: invalid UTF-8 byte sequence`);
      continue;
    }

    if (suspiciousRanges.test(text)) {
      failures.push(`${rel}: contains suspicious replacement/compatibility characters`);
    }

    if (suspiciousMojibakePattern.test(text)) {
      failures.push(`${rel}: contains suspicious mojibake pattern ('?'+Korean)`);
    }
  }
}

walk(root);

if (failures.length > 0) {
  console.error("Text encoding check failed:");
  for (const line of failures) console.error(`- ${line}`);
  process.exit(1);
}

console.log("Text encoding check passed.");
