/**
 * =============================================================
 * EXPORT FULL HTML SITE TREE
 * =============================================================
 * This script walks through the project directory, recursively
 * building a JSON representation of the site structure.
 * 
 * Its purpose is to extract meaningful pages (user-facing HTML files)
 * and selectively include only those that are explicitly flagged
 * for inclusion in the sitemap.
 * 
 * HOW IT WORKS:
 * - For each `.html` file found:
 *   • It parses the file’s contents to extract the <title> tag
 *   • It checks for the presence of a <meta name="sitemap" content="include">
 *     declaration, which explicitly marks the page for inclusion
 *   • Files with <meta name="sitemap" content="exclude"> are skipped intentionally
 *   • Files with no sitemap meta tag at all are skipped by default, and logged
 * 
 * All included pages will be exported with their file name,
 * relative path, and title into `tree.json`.
 */

import fs from 'fs';
import path from 'path';

// === CONFIGURATION ===
const rootDir = process.cwd(); // Project root
const outputFile = path.join(rootDir, 'assets', 'data', 'tree.json'); // Output location

// === HELPER FUNCTION: Extract <title> from HTML ===
/**
 * This function parses a given HTML string and attempts to locate
 * the <title> tag. It uses a simple regular expression match and
 * returns the text inside the tag. If no title is found, it returns null.
 */
function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

// === HELPER FUNCTION: Detect Sitemap Meta Tags ===
/**
 * This block checks for two specific <meta> tags inside the HTML:
 * 
 *  - <meta name="sitemap" content="include"> → The page will be added to the sitemap
 *  - <meta name="sitemap" content="exclude"> → The page will be excluded intentionally
 * 
 * If neither tag is found, the page is ignored by default, and logged
 * as a candidate for developer review. This encourages clean metadata
 * and makes all inclusion decisions explicit.
 */
function checkSitemapMeta(html) {
  const include = /<meta\s+name=["']sitemap["']\s+content=["']include["']\s*\/?>/i.test(html);
  const exclude = /<meta\s+name=["']sitemap["']\s+content=["']exclude["']\s*\/?>/i.test(html);
  return { include, exclude };
}

// === MAIN TREE BUILDING FUNCTION ===
/**
 * This function recursively traverses the directory structure starting
 * at the root of the project. It builds a hierarchical representation
 * of all folders and selectively includes .html files that are meant
 * to appear in the sitemap.
 * 
 * The result is a structured JSON object containing only the important
 * pages of the site, properly labeled and organized.
 */
function buildTree(currentPath, relativePath = '') {
  const name = path.basename(currentPath);
  const node = { name };
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  const children = [];

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name);
    const entryRelPath = path.join(relativePath, name, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const child = buildTree(entryPath, path.join(relativePath, name));
      if (child) children.push(child);
    }

    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = fs.readFileSync(entryPath, 'utf8');
      const title = extractTitle(html);
      const { include, exclude } = checkSitemapMeta(html);

      /**
       * DECISION LOGIC:
       * - If page is explicitly marked `include`, it will be added.
       * - If page is explicitly marked `exclude`, it will be skipped silently.
       * - If page is untagged, it will be skipped and logged as a warning.
       */

      if (include) {
        if (!title) {
          console.warn(`⚠️ [TITLE MISSING] ${entryPath}`);
        }

        children.push({
          name: entry.name,
          path: entryRelPath,
          title: title || entry.name,
          sitemap: true
        });
      }

      else if (exclude) {
        console.log(`ℹ️ [EXCLUDED] ${entryPath} — Skipped by developer intent.`);
      }

      else {
        console.warn(`⚠️ [SITEMAP TAG MISSING] ${entryPath} — Page was skipped.`);
      }
    }
  }

  if (children.length > 0) {
    node.children = children;
    return node;
  }

  return null; // Do not include empty branches
}

// === EXECUTION ===
try {
  console.log('📂 Scanning site folders for HTML pages...');
  const tree = buildTree(rootDir);
  fs.writeFileSync(outputFile, JSON.stringify(tree, null, 2), 'utf8');
  console.log(`✅ Export complete! Sitemap written to: ${outputFile}`);
} catch (err) {
  console.error('❌ Export failed:', err);
}
