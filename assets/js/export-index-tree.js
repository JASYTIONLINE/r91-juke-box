/**
 * =============================================================
 * DigiPort Project — Site Tree Exporter with Page Titles
 * =============================================================
 * PURPOSE:
 * This Node.js script scans the entire project folder tree.
 * Its goal is to detect every folder that contains an `index.html`,
 * and extract the page title from inside that file's <title>...</title> tag.
 *
 * It then creates a single JSON file (tree.json) representing the
 * entire folder structure, including:
 *  - name: the folder or file name
 *  - indexPath: where to find the index.html (if present)
 *  - title: the human-readable label pulled from the <title> tag
 *  - children: subfolders or files
 *
 * This JSON becomes the dynamic data source for building your sitemap.
 * You run this script any time you add, remove, or rename pages.
 * 
 * OUTPUT: assets/data/tree.json
 */

// ================================
// NODE CORE MODULES
// ================================

/**
 * 'fs' stands for "file system".
 * It’s a built-in Node.js module that allows you to read from and write to files.
 * We'll use this to read HTML files, check folders, and write our output JSON.
 */
import fs from 'fs';

/**
 * 'path' is another core module that helps build file paths
 * in a way that's safe across all operating systems (Windows, Mac, Linux).
 * For example: it knows whether to use / or \ depending on your machine.
 */
import path from 'path';

// ================================
// PATH SETUP
// ================================

/**
 * rootDir:
 * The full path to the current working directory where the script runs.
 * This is usually the project root.
 */
const rootDir = process.cwd();

/**
 * outputFile:
 * This is where the final tree.json file will be saved.
 * It will live in: assets/data/tree.json
 */
const outputFile = path.join(rootDir, 'assets', 'data', 'tree.json');

// ================================
// HELPER FUNCTION: extractTitleFromIndex()
// ================================

/**
 * This function opens a given index.html file and looks for the <title>...</title> tag.
 * It uses a regular expression (regex) to match that pattern.
 * If it finds a title, it returns the text inside it.
 * If not, it returns null and lets the parent function handle the fallback.
 *
 * @param {string} indexPath - Full file path to index.html
 * @returns {string|null} - The title found inside the HTML, or null
 */
function extractTitleFromIndex(indexPath) {
  try {
    // Read the entire contents of index.html as a UTF-8 string
    const html = fs.readFileSync(indexPath, 'utf8');

    // Use regular expression to find <title> tags
    const match = html.match(/<title>(.*?)<\/title>/i);

    // If match is found, return the inner text
    if (match && match[1]) {
      return match[1].trim(); // Remove any surrounding whitespace
    }
  } catch (err) {
    console.warn(`⚠️ Could not read or parse title from ${indexPath}`);
  }

  // If anything fails, return null (no title)
  return null;
}

// ================================
// MAIN RECURSIVE FUNCTION: buildTree()
// ================================

/**
 * This is the core engine of the script.
 * It recursively walks through every folder in the project.
 * For each folder, it:
 *   - checks for index.html
 *   - extracts the title if present
 *   - adds that folder’s files and subfolders as "children"
 *
 * This function is what builds the actual nested object used to create tree.json.
 *
 * @param {string} currentPath - Full path to the current folder
 * @param {string} relativePath - Relative path from root (used for clean URLs)
 * @returns {object} - A tree node representing the folder and its contents
 */
function buildTree(currentPath, relativePath = '') {
  const name = path.basename(currentPath); // Name of the current folder
  const item = { name };                   // This will be the JSON object for this node

  // Read all files and folders in the current directory
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  // Check if index.html exists in this folder
  const indexExists = entries.some(e => e.isFile() && e.name === 'index.html');
  if (indexExists) {
    // Build the relative path for the index.html (for URLs in the browser)
    const indexPath = path.join(currentPath, 'index.html');
    const relativeIndexPath = path.join(relativePath, name, 'index.html').replace(/\\/g, '/');

    item.indexPath = relativeIndexPath;

    // Try to extract <title> from the index.html
    const pageTitle = extractTitleFromIndex(indexPath);
    if (pageTitle) {
      item.title = pageTitle;
    } else {
      console.warn(`⚠️ No <title> found in ${indexPath}. Falling back to folder name.`);
    }
  }

  // Collect files and subdirectories
  const children = [];

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name);

    // If it's a folder, recurse into it and build a child node
    if (entry.isDirectory()) {
      const child = buildTree(entryPath, path.join(relativePath, name));
      children.push(child);
    }
    // If it's a file, add it to the children list
    else if (entry.isFile()) {
      children.push(entry.name);
    }
  }

  // Only add children array if it's not empty
  if (children.length > 0) {
    item.children = children;
  }

  return item;
}

// ================================
// RUN THE SCRIPT
// ================================

/**
 * This block starts the process.
 * It builds the full tree starting from the root directory,
 * then writes the output to tree.json so other pages can use it (like sitemap).
 */
try {
  console.log('📂 Scanning project folder and extracting titles...');
  const tree = buildTree(rootDir);

  fs.writeFileSync(outputFile, JSON.stringify(tree, null, 2), 'utf8');
  console.log(`✅ Success! Tree with titles written to: ${outputFile}`);
} catch (err) {
  console.error('❌ Failed to export tree with titles:', err);
}
