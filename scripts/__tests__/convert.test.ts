import fs from "fs";
import path from "path";
import {convert, resetRedirects, removeInfoBlocks} from "../convert";

// Test directory paths
const TEST_DIR = path.join(__dirname, "test-data");
const SOURCE_DIR = path.join(TEST_DIR, "docs-old");
const DEST_DIR = path.join(TEST_DIR, "docs-new");
const FIXTURES_DIR = path.join(__dirname, "fixtures");

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
		// Copy the fixture file to the test directory
		const fixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "simple.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "simple.mdx"), fixtureContent);

		// Run the conversion
		const redirects = convert(SOURCE_DIR, DEST_DIR);

		// Check if the file was converted
		expect(fs.existsSync(path.join(DEST_DIR, "simple.mdx"))).toBe(true);

		// Check the content of the converted file
		const convertedContent = fs.readFileSync(path.join(DEST_DIR, "simple.mdx"), "utf8");
		// Normalize whitespace for comparison
		const normalizedContent = convertedContent.replace(/\s+$/, "").trim() + "\n";
		expect(normalizedContent).toBe("# Simple Test\n\nThis is a simple test file.\n");

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
		// Copy the fixture file to the test directory
		const fixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "intro.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "intro.mdx"), fixtureContent);

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
		// Copy the fixture file to the test directory
		const fixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "info-blocks.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "info-blocks.mdx"), fixtureContent);

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

		// Copy fixture files to the test directories
		const rootFixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "root.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "root.mdx"), rootFixtureContent);

		const nestedFixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "nested-file.mdx"), "utf8");
		fs.writeFileSync(path.join(nestedDir, "nested-file.mdx"), nestedFixtureContent);

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
		// Copy fixture files to the test directory
		const firstFixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "first.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "first.mdx"), firstFixtureContent);

		const secondFixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "second.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "second.mdx"), secondFixtureContent);

		const thirdFixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "third.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "third.mdx"), thirdFixtureContent);

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
		// Read the fixture content
		const content = fs.readFileSync(path.join(FIXTURES_DIR, "info-blocks-content.mdx"), "utf8");

		const result = removeInfoBlocks(content);

		expect(result).not.toContain(":::info");
		expect(result).not.toContain(":::caution");
		expect(result).not.toContain(":::danger");
		expect(result).toContain("Normal text.");
		expect(result).toContain("More text.");
		expect(result).toContain("Final text.");
	});

	test("should ignore directories without MDX files", () => {
		// Create a directory structure with a non-MDX file
		const codeDir = path.join(SOURCE_DIR, "code");
		const filtersDir = path.join(codeDir, "filters-and-effects");
		fs.mkdirSync(filtersDir, {recursive: true});

		// Add a non-MDX file to the filters directory
		fs.writeFileSync(path.join(filtersDir, "blur.tsx"), "// Some TypeScript code");
		fs.writeFileSync(path.join(codeDir, "tsconfig.json"), "{}");

		// Add a regular MDX file to the source directory
		const fixtureContent = fs.readFileSync(path.join(FIXTURES_DIR, "simple.mdx"), "utf8");
		fs.writeFileSync(path.join(SOURCE_DIR, "simple.mdx"), fixtureContent);

		// Run the conversion
		convert(SOURCE_DIR, DEST_DIR);

		// Check that the MDX file was converted
		expect(fs.existsSync(path.join(DEST_DIR, "simple.mdx"))).toBe(true);

		// Check that the code directory was not created in the destination
		expect(fs.existsSync(path.join(DEST_DIR, "code"))).toBe(false);

		// Check that the _meta.js file doesn't include the code directory
		const metaContent = fs.readFileSync(path.join(DEST_DIR, "_meta.js"), "utf8");
		expect(metaContent).toContain("'simple': '',");
		expect(metaContent).not.toContain("'code': '',");
	});
});
