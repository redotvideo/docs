import fs from "fs";
import path from "path";

/**
 * Create a _meta.js file for a directory
 */
function createMetaFile(dirPath: string, items: string[]) {
	// Ensure the directory exists
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, {recursive: true});
		console.log(`Created directory for meta file: ${dirPath}`);
	}

	const metaContent = `export default {
${items.map((item) => `  '${item}': '',`).join("\n")}
}
`;
	fs.writeFileSync(path.join(dirPath, "_meta.js"), metaContent);
}

/**
 * Process a Docusaurus MDX file and convert it to Nextra format
 * For now, this is a simple copy as we're not handling custom components
 */
function processMdxFile(sourcePath: string, destPath: string) {
	// Read the source file
	const content = fs.readFileSync(sourcePath, "utf8");

	// For now, we're just copying the content as-is
	// In a more complete implementation, we would transform Docusaurus-specific
	// components and syntax to Nextra equivalents

	// Ensure the destination directory exists
	const destDir = path.dirname(destPath);
	if (!fs.existsSync(destDir)) {
		fs.mkdirSync(destDir, {recursive: true});
	}

	// Write the file
	fs.writeFileSync(destPath, content);

	// Get relative paths for logging
	const sourceRelative = path.relative(process.cwd(), sourcePath);
	const destRelative = path.relative(process.cwd(), destPath);
	console.log(`Converted: ${sourceRelative} -> ${destRelative}`);
}

/**
 * Process a directory recursively
 */
function processDirectory(sourceDir: string, destDir: string) {
	// Delete the destination directory
	fs.rmSync(destDir, {recursive: true, force: true});

	// Read the directory contents
	const items = fs.readdirSync(sourceDir);

	// Filter out hidden files and directories
	const visibleItems = items.filter((item) => !item.startsWith("."));

	// Track directories and files for meta generation
	const directories: string[] = [];
	const files: string[] = [];

	// Process each item
	for (const item of visibleItems) {
		const sourcePath = path.join(sourceDir, item);
		const stats = fs.statSync(sourcePath);

		// Handle directories
		if (stats.isDirectory()) {
			// Process subdirectory
			const destSubDir = path.join(destDir, item);
			processDirectory(sourcePath, destSubDir);
			directories.push(item);
			continue;
		}

		// Handle edge case
		if (!stats.isFile()) {
			throw new Error(`Unexpected file type: ${sourcePath}`);
		}

		// Process file
		if (!item.endsWith(".mdx") && !item.endsWith(".md")) {
			continue;
		}

		const baseName = item.replace(/\.(mdx|md)$/, "");

		// Special case for index files
		const destFileName = baseName === "intro" ? "index.mdx" : `${baseName}.mdx`;
		const destPath = path.join(destDir, destFileName);

		processMdxFile(sourcePath, destPath);

		if (baseName !== "intro") {
			files.push(baseName);
		} else {
			files.push("index");
		}
	}

	// Create _meta.js file for this directory
	const metaItems = [...files, ...directories];
	if (metaItems.length > 0) {
		createMetaFile(destDir, metaItems);
	}
}

function main() {
	// Source and destination directories
	const ROOT_DIR = path.resolve(process.cwd(), "..");
	const SOURCE_DIR = path.join(ROOT_DIR, "docs-old", "docs");
	const DEST_DIR = path.join(ROOT_DIR, "src", "content");

	// Make sure the destination directory exists
	if (!fs.existsSync(DEST_DIR)) {
		// Create the destination directory instead of throwing an error
		fs.mkdirSync(DEST_DIR, {recursive: true});
		console.log(`Created destination directory: ${DEST_DIR}`);
	}

	// Make sure it is empty (delete all files and directories if not)
	fs.rmSync(DEST_DIR, {recursive: true, force: true});
	fs.mkdirSync(DEST_DIR, {recursive: true});

	// Start the conversion process
	console.log("Starting conversion from Docusaurus to Nextra format...");
	processDirectory(SOURCE_DIR, DEST_DIR);
	console.log("Conversion complete!");
}

main();
