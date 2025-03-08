import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Redirect {
	source: string;
	destination: string;
	permanent: boolean;
}

export let redirects: Redirect[] = [];

/**
 * Create a _meta.js file for a directory
 */
export function createMetaFile(dirPath: string, items: string[]) {
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
export function removeInfoBlocks(content: string): string {
	// Match blocks that start with ::: and end with :::
	// Using non-greedy match to handle multiple blocks
	return content.replace(/:::[a-z]+\n([\s\S]*?):::/g, "");
}

/**
 * Remove attributes from code blocks
 * Transforms ```language attribute1 attribute2 to ```language
 */
export function cleanCodeBlocks(content: string): string {
	// Match code blocks with attributes and replace with clean code blocks
	// This regex matches:
	// 1. The opening backticks and language (```tsx)
	// 2. Any attributes that follow (mode=preview title="src/project.ts")
	// 3. The newline after the opening
	return content.replace(/```([a-z]+)(\s+[^`\n]+)\n/g, "```$1\n");
}

/**
 * Process a Docusaurus MDX file and convert it to Nextra format
 */
export function processMdxFile(sourcePath: string, destPath: string) {
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
	let cleanedContent = removeInfoBlocks(mdxContent);

	// Clean code blocks by removing attributes
	cleanedContent = cleanCodeBlocks(cleanedContent);

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
 * Check if a directory contains any MDX files (directly or in subdirectories)
 */
export function directoryContainsMdx(dirPath: string): boolean {
	// Read the directory contents
	const items = fs.readdirSync(dirPath);

	// Check each item
	for (const item of items) {
		const itemPath = path.join(dirPath, item);
		const stats = fs.statSync(itemPath);

		// If it's a directory, recursively check it
		if (stats.isDirectory()) {
			if (directoryContainsMdx(itemPath)) {
				return true;
			}
		}
		// If it's an MDX file, return true
		else if (stats.isFile() && (item.endsWith(".mdx") || item.endsWith(".md"))) {
			return true;
		}
	}

	// No MDX files found
	return false;
}

/**
 * Process a directory recursively
 */
export function processDirectory(sourceDir: string, destDir: string) {
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
			// Only process directory if it contains MDX files
			if (directoryContainsMdx(sourcePath)) {
				// Process subdirectory
				const destSubDir = path.join(destDir, item);
				processDirectory(sourcePath, destSubDir);
				directories.push(item);
			} else {
				console.log(`Skipping directory without MDX files: ${sourcePath}`);
			}
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

		// Create destination directory if it doesn't exist
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir, {recursive: true});
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

export function resetRedirects() {
	redirects = [];
}

export function convert(sourceDir: string, destDir: string) {
	// Make sure the destination directory exists
	if (!fs.existsSync(destDir)) {
		// Create the destination directory instead of throwing an error
		fs.mkdirSync(destDir, {recursive: true});
		console.log(`Created destination directory: ${destDir}`);
	} else {
		// Clean the destination directory
		fs.rmSync(destDir, {recursive: true, force: true});
		fs.mkdirSync(destDir, {recursive: true});
	}

	// Start the conversion process
	console.log("Starting conversion from Docusaurus to Nextra format...");
	processDirectory(sourceDir, destDir);

	// Return redirects for testing purposes
	return redirects;
}

function main() {
	// Source and destination directories
	const ROOT_DIR = path.resolve(process.cwd(), "..");
	const SOURCE_DIR = path.join(ROOT_DIR, "docs-old", "docs");
	const DEST_DIR = path.join(ROOT_DIR, "src", "content");

	// Run the conversion
	const redirects = convert(SOURCE_DIR, DEST_DIR);

	// Write out redirects
	const redirectsPath = path.join(ROOT_DIR, "redirects.json");
	fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2));
	console.log(`Wrote ${redirects.length} redirects to ${redirectsPath}`);

	console.log("Conversion complete!");
}

// Only run main when this file is executed directly
if (require.main === module) {
	main();
}
