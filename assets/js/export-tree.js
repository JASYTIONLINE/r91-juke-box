/**
 * export-tree.js
 * Prints the folder + file structure of the current directory into tree.txt
 */

import fs from "fs";
import path from "path";

const root = process.cwd();
let output = "";

function walk(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry, i) => {
    const connector = i === entries.length - 1 ? "└── " : "├── ";
    output += `${prefix}${connector}${entry.name}\n`;
    if (entry.isDirectory()) {
      const nextPrefix = prefix + (i === entries.length - 1 ? "    " : "│   ");
      walk(path.join(dir, entry.name), nextPrefix);
    }
  });
}

output += path.basename(root) + "\n";
walk(root);
fs.writeFileSync("tree.txt", output);
console.log("✅  Wrote folder tree to tree.txt");
