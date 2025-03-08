import fs from "fs";
import path from "path";
import {convert, resetRedirects, removeInfoBlocks} from "../convert";

// Test directory paths
const TEST_DIR = path.join(__dirname, "test-data");
const SOURCE_DIR = path.join(TEST_DIR, "docs-old");
const DEST_DIR = path.join(TEST_DIR, "docs-new");

describe("Docusaurus to Nextra conversion", () => {
	// Set up test directories and files before each test
	beforeEach(() => {
		// Clean up test directories if they exist
		if (fs.existsSync(TEST_DIR)) {
			fs.rmSync(TEST_DIR, {recursive: true, force: true});
		}

		// Create test directories
		fs.mkdirSync(SOURCE_DIR, {recursive: true});

		// Reset redirects array
		resetRedirects();
	});

	// Clean up after tests
	afterEach(() => {
		if (fs.existsSync(TEST_DIR)) {
			fs.rmSync(TEST_DIR, {recursive: true, force: true});
		}
	});

	test("should convert a simple MDX file with frontmatter", () => {
		// Create a test MDX file with frontmatter
		const testMdxContent = `---
sidebar_position: 2
slug: /test/simple
---

# Simple Test

This is a simple test file.
`;

		fs.writeFileSync(path.join(SOURCE_DIR, "simple.mdx"), testMdxContent);

		// Run the conversion
		const redirects = convert(SOURCE_DIR, DEST_DIR);

		// Check if the file was converted
		expect(fs.existsSync(path.join(DEST_DIR, "simple.mdx"))).toBe(true);

		// Check the content of the converted file
		const convertedContent = fs.readFileSync(path.join(DEST_DIR, "simple.mdx"), "utf8");
		expect(convertedContent).toBe("# Simple Test\n\nThis is a simple test file.\n");

		// Check if _meta.js was created
		expect(fs.existsSync(path.join(DEST_DIR, "_meta.js"))).toBe(true);

		// Check the content of _meta.js
		const metaContent = fs.readFileSync(path.join(DEST_DIR, "_meta.js"), "utf8");
		expect(metaContent).toContain("'simple': '',");

		// Check if redirect was created
		expect(redirects.length).toBe(1);
		expect(redirects[0].source).toBe("/test/simple");
		expect(redirects[0].destination).toContain("/simple");
		expect(redirects[0].permanent).toBe(true);
	});

	test("should convert intro.mdx to index.mdx", () => {
		// Create a test intro.mdx file
		const testMdxContent = `---
sidebar_position: 1
---

# Introduction

This is the introduction.
`;

		fs.writeFileSync(path.join(SOURCE_DIR, "intro.mdx"), testMdxContent);

		// Run the conversion
		convert(SOURCE_DIR, DEST_DIR);

		// Check if index.mdx was created (not intro.mdx)
		expect(fs.existsSync(path.join(DEST_DIR, "index.mdx"))).toBe(true);
		expect(fs.existsSync(path.join(DEST_DIR, "intro.mdx"))).toBe(false);

		// Check the content of _meta.js
		const metaContent = fs.readFileSync(path.join(DEST_DIR, "_meta.js"), "utf8");
		expect(metaContent).toContain("'index': '',");
	});

	test("should remove info blocks from content", () => {
		// Create a test MDX file with info blocks
		const testMdxContent = `---
sidebar_position: 3
---

# Info Blocks Test

Normal text.

:::info
This is an info block.
:::

More normal text.

:::caution
This is a caution block.
:::

Final text.
`;

		fs.writeFileSync(path.join(SOURCE_DIR, "info-blocks.mdx"), testMdxContent);

		// Run the conversion
		convert(SOURCE_DIR, DEST_DIR);

		// Check the content of the converted file
		const convertedContent = fs.readFileSync(path.join(DEST_DIR, "info-blocks.mdx"), "utf8");

		// The info blocks should be removed
		expect(convertedContent).not.toContain(":::info");
		expect(convertedContent).not.toContain(":::caution");
		expect(convertedContent).toContain("Normal text.");
		expect(convertedContent).toContain("More normal text.");
		expect(convertedContent).toContain("Final text.");
	});

	test("should process nested directories", () => {
		// Create nested directories with files
		const nestedDir = path.join(SOURCE_DIR, "nested");
		fs.mkdirSync(nestedDir, {recursive: true});

		// Create files in the root and nested directories
		fs.writeFileSync(
			path.join(SOURCE_DIR, "root.mdx"),
			`---
sidebar_position: 1
---
# Root File
`,
		);

		fs.writeFileSync(
			path.join(nestedDir, "nested-file.mdx"),
			`---
sidebar_position: 2
slug: /nested/file
---
# Nested File
`,
		);

		// Run the conversion
		const redirects = convert(SOURCE_DIR, DEST_DIR);

		// Check if files were created in the correct structure
		expect(fs.existsSync(path.join(DEST_DIR, "root.mdx"))).toBe(true);
		expect(fs.existsSync(path.join(DEST_DIR, "nested"))).toBe(true);
		expect(fs.existsSync(path.join(DEST_DIR, "nested", "nested-file.mdx"))).toBe(true);

		// Check if _meta.js files were created in both directories
		expect(fs.existsSync(path.join(DEST_DIR, "_meta.js"))).toBe(true);
		expect(fs.existsSync(path.join(DEST_DIR, "nested", "_meta.js"))).toBe(true);

		// Check the content of root _meta.js
		const rootMetaContent = fs.readFileSync(path.join(DEST_DIR, "_meta.js"), "utf8");
		expect(rootMetaContent).toContain("'root': '',");
		expect(rootMetaContent).toContain("'nested': '',");

		// Check the content of nested _meta.js
		const nestedMetaContent = fs.readFileSync(path.join(DEST_DIR, "nested", "_meta.js"), "utf8");
		expect(nestedMetaContent).toContain("'nested-file': '',");

		// Check if redirect was created for the nested file
		expect(redirects.length).toBe(1);
		expect(redirects[0].source).toBe("/nested/file");
	});

	test("should sort files by sidebar_position in _meta.js", () => {
		// Create files with different sidebar positions
		fs.writeFileSync(
			path.join(SOURCE_DIR, "third.mdx"),
			`---
sidebar_position: 3
---
# Third
`,
		);

		fs.writeFileSync(
			path.join(SOURCE_DIR, "first.mdx"),
			`---
sidebar_position: 1
---
# First
`,
		);

		fs.writeFileSync(
			path.join(SOURCE_DIR, "second.mdx"),
			`---
sidebar_position: 2
---
# Second
`,
		);

		// Run the conversion
		convert(SOURCE_DIR, DEST_DIR);

		// Check the content of _meta.js to ensure correct order
		const metaContent = fs.readFileSync(path.join(DEST_DIR, "_meta.js"), "utf8");

		// Extract the order of files from _meta.js
		const fileOrder = metaContent.match(/'([^']+)':/g)?.map((match) => match.replace(/[':]|,/g, ""));

		// Check if files are ordered by sidebar_position
		expect(fileOrder).toEqual(["first", "second", "third"]);
	});

	// Test the removeInfoBlocks function directly
	test("removeInfoBlocks should remove all info blocks", () => {
		const content = `
# Title

Normal text.

:::info
This is an info block.
With multiple lines.
:::

More text.

:::caution
This is a caution block.
:::

:::danger
Danger block.
:::

Final text.
`;

		const result = removeInfoBlocks(content);

		expect(result).not.toContain(":::info");
		expect(result).not.toContain(":::caution");
		expect(result).not.toContain(":::danger");
		expect(result).toContain("Normal text.");
		expect(result).toContain("More text.");
		expect(result).toContain("Final text.");
	});
});
