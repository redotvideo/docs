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
 * Convert ::: blocks to Nextra callouts
 */
export function convertInfoBlocks(content: string): string {
	// Map of Docusaurus block types to Nextra callout types
	const blockTypeMap: Record<string, string> = {
		note: "NOTE",
		tip: "TIP",
		info: "NOTE",
		caution: "CAUTION",
		danger: "WARNING",
		experimental: "IMPORTANT",
	};

	// Match blocks that start with ::: and end with :::
	// Using non-greedy match to handle multiple blocks
	return content.replace(/:::([\w]+)\n([\s\S]*?):::/g, (_, type, blockContent) => {
		const calloutType = blockTypeMap[type.toLowerCase()] || type.toUpperCase();
		// Format the content: add > prefix to each line and ensure proper spacing
		const formattedContent = blockContent
			.trim()
			.split("\n")
			.map((line: string) => `> ${line}`)
			.join("\n");

		return `> [!${calloutType}]\n>\n${formattedContent}\n>`;
	});
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
	return content.replace(/```([a-z]+)[^\S\r\n]+(.*)\n/g, "```$1\n");
}

/**
 * Remove React imports and component usage from MDX content
 *
 * This function removes all import statements from a file that aren't inside of
 * code blocks.
 *
 * It also removes all component usage from the file that isn't inside of code blocks.
 */
export function removeReactComponents(content: string): string {
	// Split the content by code blocks to avoid modifying content inside code blocks
	const parts = content.split(/(```[^`]+```)/g);

	// Process each part - if it's a code block, leave it as is; otherwise, remove imports and components
	const processedParts = parts.map((part) => {
		// If this is a code block, leave it unchanged
		if (part.startsWith("```") && part.endsWith("```")) {
			return part;
		}

		// Remove import statements
		let processed = part.replace(/^import\s+.*?from\s+["'].*?["'];?\s*$/gm, "");

		// Remove React component tags (matches <ComponentName props... /> or <ComponentName>...</ComponentName>)
		// First, handle self-closing tags
		processed = processed.replace(/<[A-Z][A-Za-z0-9]*(\s+[^>]*?)?\s*\/>\s*/g, "");

		// Then handle opening/closing tag pairs
		processed = processed.replace(/<[A-Z][A-Za-z0-9]*(\s+[^>]*?)?>(.*?)<\/[A-Z][A-Za-z0-9]*>\s*/gs, "");

		return processed;
	});

	// Get rid of leading and trailing newlines
	const joined = processedParts.join("").replace(/^\s+|\s+$/g, "");

	// Add a trailing newline
	return joined + "\n";
}

/**
 * Process a Docusaurus MDX file and convert it to Nextra format
 */
export function processMdxFile(sourcePath: string, destPath: string, rootDestDir: string) {
	// Read the source file
	const content = fs.readFileSync(sourcePath, "utf8");

	// Parse frontmatter
	const {data: frontmatter, content: mdxContent} = matter(content);

	// Handle redirects if slug is present
	if (frontmatter.slug) {
		const oldPath = frontmatter.slug.startsWith("/") ? frontmatter.slug : `/${frontmatter.slug}`;
		const relativePath = path.relative(rootDestDir, destPath);
		const newPath =
			"/" +
			relativePath
				.replace(/^src\/content\//, "")
				.replace(/\.(mdx?|jsx?)$/, "")
				.replace(/index$/, "");

		redirects.push({
			source: oldPath,
			destination: newPath,
			permanent: true,
		});
	}

	// Remove ::: blocks and clean up content
	let cleanedContent = convertInfoBlocks(mdxContent);

	// Clean code blocks by removing attributes
	cleanedContent = cleanCodeBlocks(cleanedContent);

	// Remove React imports and components
	cleanedContent = removeReactComponents(cleanedContent);

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
		if (stats.isDirectory() && directoryContainsMdx(itemPath)) {
			return true;
		}

		// Skip directories
		if (stats.isDirectory()) {
			continue;
		}

		// If it's an MDX file, return true
		if (stats.isFile() && (item.endsWith(".mdx") || item.endsWith(".md"))) {
			return true;
		}
	}

	// No MDX files found
	return false;
}

/**
 * Process a directory recursively
 *
 * @param sourceDir - The source directory to process
 * @param destDir - The destination directory to write to
 * @param rootDestDir - The destination directory we started with
 */
export function processDirectory(sourceDir: string, destDir: string, rootDestDir: string) {
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
		const isDirectory = stats.isDirectory();

		if (isDirectory && !directoryContainsMdx(sourcePath)) {
			console.log(`Skipping directory without MDX files: ${sourcePath}`);
			continue;
		}

		if (isDirectory && directoryContainsMdx(sourcePath)) {
			const destSubDir = path.join(destDir, item);
			processDirectory(sourcePath, destSubDir, rootDestDir);
			directories.push(item);
			continue;
		}

		// Handle edge case
		if (!stats.isFile()) {
			throw new Error(`Unexpected file type: ${sourcePath}`);
		}

		// Skip non-MDX files
		if (!item.endsWith(".mdx") && !item.endsWith(".md")) {
			continue;
		}

		// Create destination directory if it doesn't exist
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir, {recursive: true});
		}

		const baseName = item.replace(/\.(mdx|md)$/, "");

		// Special case for index files
		const destFileName = `${baseName}.mdx`;
		const destPath = path.join(destDir, destFileName);

		// Process the file and get its frontmatter
		const frontmatter = processMdxFile(sourcePath, destPath, rootDestDir);

		// Add to files array with position if available
		files.push({
			name: baseName,
			position: frontmatter.sidebar_position,
		});
	}

	// Sort files by sidebar_position if available
	files.sort((a, b) => {
		// If both positions are undefined, sort by name
		if (a.position === undefined && b.position === undefined) {
			return a.name.localeCompare(b.name);
		}

		// If only a's position is undefined, it comes after b
		if (a.position === undefined) return 1;

		// If only b's position is undefined, it comes after a
		if (b.position === undefined) return -1;

		// Both have positions, sort by position
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
	// Clean or create the destination directory
	if (fs.existsSync(destDir)) {
		// Clean the destination directory if it exists
		fs.rmSync(destDir, {recursive: true, force: true});
	}

	// Create the destination directory (either fresh or after cleaning)
	fs.mkdirSync(destDir, {recursive: true});
	console.log(`Destination directory ready: ${destDir}`);

	// Start the conversion process
	console.log("Starting conversion from Docusaurus to Nextra format...");
	processDirectory(sourceDir, destDir, destDir);

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
