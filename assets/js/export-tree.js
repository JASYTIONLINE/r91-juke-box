/**
 * ==============================================================
 * export-index-tree.js
 * --------------------------------------------------------------
 * PURPOSE:
 * - Recursively scans the project directory.
 * - Builds a JSON tree of all folders and files.
 * - Adds an "indexPath" property when a folder contains index.html.
 * - Saves the result to /assets/data/tree.json.
 * --------------------------------------------------------------
 * USAGE:
 *   node export-index-tree.js
 * OUTPUT:
 *   /assets/data/tree.json
 * ==============================================================
 */

import fs from "fs";
import path from "path";

// === CONFIGURATION ===
const rootDir = process.cwd();                      // project root
const outputDir = path.join(rootDir, "assets", "data");
const outputFile = path.join(outputDir, "tree.json");

// === RECURSIVE SCAN FUNCTION ===
function buildTree(dirPath, relativePath = "") {
  const name = path.basename(dirPath);
  const item = { name };

  // Read directory entries
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // Check for index.html in this folder
  const hasIndex = entries.some(e => e.isFile() && e.name.toLowerCase() === "index.html");
  if (hasIndex) {
    item.indexPath = path.join(relativePath, name, "index.html").replace(/\\/g, "/");
  }

  const children = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const childDir = path.join(dirPath, entry.name);
      const childRelative = path.join(relativePath, name);
      children.push(buildTree(childDir, childRelative));
    } else if (entry.isFile()) {
      children.push(entry.name);
    }
  }

  if (children.length > 0) item.children = children;
  return item;
}

// === MAIN EXECUTION ===
try {
  console.log("📂 Scanning project directory...");

  const tree = buildTree(rootDir);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(tree, null, 2), "utf8");

  console.log(`✅ Folder tree (with index paths) exported to ${outputFile}`);
} catch (err) {
  console.error("❌ Error generating index tree:", err);
}
