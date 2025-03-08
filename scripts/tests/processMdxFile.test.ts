import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {processMdxFile, Redirect} from "../convert";

// Mock dependencies
jest.mock("fs", () => ({
	readFileSync: jest.fn(),
	writeFileSync: jest.fn(),
	existsSync: jest.fn(),
	mkdirSync: jest.fn(),
}));

jest.mock("path", () => ({
	dirname: jest.fn(),
	join: jest.fn(),
	relative: jest.fn(),
}));

// Mock gray-matter
jest.mock("gray-matter");
const mockedMatter = matter as jest.MockedFunction<typeof matter>;

// Mock console.log
const originalConsoleLog = console.log;
beforeEach(() => {
	console.log = jest.fn();
});
afterEach(() => {
	console.log = originalConsoleLog;
});

describe("processMdxFile", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should process an MDX file with frontmatter and slug", () => {
		// Setup mocks
		const sourcePath = "/source/path/file.mdx";
		const destPath = "/dest/path/file.mdx";
		const fileContent = `---
title: Test Title
sidebar_position: 2
slug: /test-slug
---

# Test Content

:::info
This is an info block.
:::

Some content.`;

		const frontmatter = {
			title: "Test Title",
			sidebar_position: 2,
			slug: "/test-slug",
		};

		const mdxContent = `
# Test Content

:::info
This is an info block.
:::

Some content.`;

		const cleanedContent = `
# Test Content


Some content.`;

		// Mock fs.readFileSync
		(fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

		// Mock gray-matter
		mockedMatter.mockReturnValue({
			data: frontmatter,
			content: mdxContent,
		} as any);

		// Mock path functions
		(path.dirname as jest.Mock).mockReturnValue("/dest/path");
		(path.relative as jest.Mock).mockReturnValue("src/content/file.mdx");
		(fs.existsSync as jest.Mock).mockReturnValue(true);

		// Create a redirects array for testing
		const redirectsArray: Redirect[] = [];

		// Call the function
		const result = processMdxFile(sourcePath, destPath, redirectsArray);

		// Verify the result
		expect(result).toEqual(frontmatter);

		// Verify redirects were added
		expect(redirectsArray).toHaveLength(1);
		expect(redirectsArray[0]).toEqual({
			source: "/test-slug",
			destination: "/file",
			permanent: true,
		});

		// Verify file was written
		expect(fs.writeFileSync).toHaveBeenCalledWith(destPath, expect.any(String));
	});

	it("should process an MDX file without a slug", () => {
		// Setup mocks
		const sourcePath = "/source/path/file.mdx";
		const destPath = "/dest/path/file.mdx";
		const fileContent = `---
title: Test Title
sidebar_position: 2
---

# Test Content

Some content.`;

		const frontmatter = {
			title: "Test Title",
			sidebar_position: 2,
		};

		const mdxContent = `
# Test Content

Some content.`;

		// Mock fs.readFileSync
		(fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

		// Mock gray-matter
		mockedMatter.mockReturnValue({
			data: frontmatter,
			content: mdxContent,
		} as any);

		// Mock path functions
		(path.dirname as jest.Mock).mockReturnValue("/dest/path");
		(fs.existsSync as jest.Mock).mockReturnValue(true);

		// Create a redirects array for testing
		const redirectsArray: Redirect[] = [];

		// Call the function
		const result = processMdxFile(sourcePath, destPath, redirectsArray);

		// Verify the result
		expect(result).toEqual(frontmatter);

		// Verify no redirects were added
		expect(redirectsArray).toHaveLength(0);

		// Verify file was written
		expect(fs.writeFileSync).toHaveBeenCalledWith(destPath, expect.any(String));
	});

	it("should create the destination directory if it does not exist", () => {
		// Setup mocks
		const sourcePath = "/source/path/file.mdx";
		const destPath = "/dest/path/file.mdx";
		const fileContent = `---
title: Test Title
---

# Test Content`;

		const frontmatter = {
			title: "Test Title",
		};

		const mdxContent = `
# Test Content`;

		// Mock fs.readFileSync
		(fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

		// Mock gray-matter
		mockedMatter.mockReturnValue({
			data: frontmatter,
			content: mdxContent,
		} as any);

		// Mock path functions
		(path.dirname as jest.Mock).mockReturnValue("/dest/path");
		(fs.existsSync as jest.Mock).mockReturnValue(false);

		// Call the function
		processMdxFile(sourcePath, destPath);

		// Verify directory was created
		expect(fs.mkdirSync).toHaveBeenCalledWith("/dest/path", {recursive: true});
	});
});
