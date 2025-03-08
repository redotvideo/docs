import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface Redirect {
	source: string;
	destination: string;
	permanent: boolean;
}

let redirects: Redirect[] = [];

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
 * Remove ::: blocks from the content
 */
function removeInfoBlocks(content: string): string {
	// Match blocks that start with ::: and end with :::
	// Using non-greedy match to handle multiple blocks
	return content.replace(/:::[a-z]+\n([\s\S]*?):::/g, "");
}

/**
 * Process a Docusaurus MDX file and convert it to Nextra format
 */
function processMdxFile(sourcePath: string, destPath: string) {
	// Read the source file
	const content = fs.readFileSync(sourcePath, "utf8");

	// Parse frontmatter
	const {data: frontmatter, content: mdxContent} = matter(content);

	// Handle redirects if slug is present
	if (frontmatter.slug) {
		const oldPath = frontmatter.slug.startsWith("/") ? frontmatter.slug : `/${frontmatter.slug}`;
		const newPath =
			"/" +
			path
				.relative(process.cwd(), destPath)
				.replace(/^src\/content\//, "")
				.replace(/\.(mdx?|jsx?)$/, "");

		redirects.push({
			source: oldPath,
			destination: newPath,
			permanent: true,
		});
	}

	// Remove ::: blocks and clean up content
	const cleanedContent = removeInfoBlocks(mdxContent);

	// Write only the content without frontmatter
	const destDir = path.dirname(destPath);
	if (!fs.existsSync(destDir)) {
		fs.mkdirSync(destDir, {recursive: true});
	}

	// Remove any empty lines at the start of cleanedContent
	const finalContent = cleanedContent.replace(/^\s+/, "");
	fs.writeFileSync(destPath, finalContent);

	// Get relative paths for logging
	const sourceRelative = path.relative(process.cwd(), sourcePath);
	const destRelative = path.relative(process.cwd(), destPath);
	console.log(`Converted: ${sourceRelative} -> ${destRelative}`);

	return frontmatter;
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
	const files: {name: string; position?: number}[] = [];

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

		// Process the file and get its frontmatter
		const frontmatter = processMdxFile(sourcePath, destPath);

		// Add to files array with position if available
		if (baseName !== "intro") {
			files.push({
				name: baseName,
				position: frontmatter.sidebar_position,
			});
		} else {
			files.push({
				name: "index",
				position: frontmatter.sidebar_position,
			});
		}
	}

	// Sort files by sidebar_position if available
	files.sort((a, b) => {
		if (a.position === undefined && b.position === undefined) {
			return a.name.localeCompare(b.name);
		}
		if (a.position === undefined) return 1;
		if (b.position === undefined) return -1;
		return a.position - b.position;
	});

	// Create _meta.js file for this directory
	const metaItems = [...files.map((file) => file.name), ...directories.sort()];
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

	// Write out redirects
	const redirectsPath = path.join(ROOT_DIR, "redirects.json");
	fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2));
	console.log(`Wrote ${redirects.length} redirects to ${redirectsPath}`);

	console.log("Conversion complete!");
}

main();
