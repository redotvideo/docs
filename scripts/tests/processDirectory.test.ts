import fs from "fs";
import path from "path";
import {createMetaFile, processMdxFile, Redirect} from "../convert";

// Mock dependencies
jest.mock("fs", () => ({
	readdirSync: jest.fn(),
	statSync: jest.fn(),
	rmSync: jest.fn(),
	existsSync: jest.fn(),
	mkdirSync: jest.fn(),
	readFileSync: jest.fn(),
	writeFileSync: jest.fn(),
}));

jest.mock("path", () => ({
	join: jest.fn((dir, file) => `${dir}/${file}`),
	dirname: jest.fn(),
	relative: jest.fn(),
}));

// Mock gray-matter
jest.mock("gray-matter", () => {
	return jest.fn(() => ({
		data: {sidebar_position: 1},
		content: "# Test Content",
	}));
});

// Mock processMdxFile and createMetaFile functions
jest.mock("../convert", () => {
	const originalModule = jest.requireActual("../convert");

	// Create a mock implementation of processMdxFile
	const mockProcessMdxFile = jest.fn((sourcePath, destPath) => {
		if (sourcePath.includes("file1")) {
			return {sidebar_position: 1};
		} else if (sourcePath.includes("file2")) {
			return {sidebar_position: 2};
		} else if (sourcePath.includes("intro")) {
			return {sidebar_position: 1};
		}
		return {};
	});

	return {
		...originalModule,
		processMdxFile: mockProcessMdxFile,
		createMetaFile: jest.fn(),
		// Keep the original processDirectory function
		processDirectory: originalModule.processDirectory,
	};
});

// Import the real processDirectory function after mocking
// Use a different name to avoid conflict
const {processDirectory: realProcessDirectory} = jest.requireActual("../convert");

describe("processDirectory", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should process a directory with files and subdirectories", () => {
		// Setup mocks
		const sourceDir = "/source/dir";
		const destDir = "/dest/dir";

		// Mock fs.readdirSync
		(fs.readdirSync as jest.Mock).mockReturnValue(["file1.mdx", "file2.md", "subdir", ".hidden", "other.txt"]);

		// Mock fs.statSync
		(fs.statSync as jest.Mock).mockImplementation((path) => ({
			isDirectory: () => path.includes("subdir"),
			isFile: () => !path.includes("subdir"),
		}));

		// Mock recursive processDirectory call to avoid infinite recursion
		// We need to cast the mock to any to avoid TypeScript errors
		(fs.readdirSync as any).mockImplementation((dir: string) => {
			if (dir.toString().includes("subdir")) {
				return [];
			}
			return ["file1.mdx", "file2.md", "subdir", ".hidden", "other.txt"];
		});

		// Create a redirects array for testing
		const redirectsArray: Redirect[] = [];

		// Call the function
		const result = realProcessDirectory(sourceDir, destDir, redirectsArray);

		// Verify rmSync was called to clean the destination directory
		expect(fs.rmSync).toHaveBeenCalledWith(destDir, {recursive: true, force: true});

		// Verify processMdxFile was called for each MDX file
		expect(processMdxFile).toHaveBeenCalledTimes(2);
		expect(processMdxFile).toHaveBeenCalledWith(`${sourceDir}/file1.mdx`, `${destDir}/file1.mdx`, redirectsArray);
		expect(processMdxFile).toHaveBeenCalledWith(`${sourceDir}/file2.md`, `${destDir}/file2.mdx`, redirectsArray);

		// Verify the result
		expect(result.files.length).toBe(2);
		expect(result.directories).toContain("subdir");
	});

	it("should handle special case for intro files", () => {
		// Setup mocks
		const sourceDir = "/source/dir";
		const destDir = "/dest/dir";

		// Mock fs.readdirSync
		(fs.readdirSync as jest.Mock).mockReturnValue(["intro.mdx"]);

		// Mock fs.statSync
		(fs.statSync as jest.Mock).mockImplementation(() => ({
			isDirectory: () => false,
			isFile: () => true,
		}));

		// Call the function
		const result = realProcessDirectory(sourceDir, destDir);

		// Verify processMdxFile was called with the correct paths
		expect(processMdxFile).toHaveBeenCalledWith(
			`${sourceDir}/intro.mdx`,
			`${destDir}/index.mdx`,
			expect.any(Array),
		);

		// Verify the result
		expect(result.files.length).toBe(1);
		expect(result.files[0].name).toBe("index");
	});

	it("should handle empty directories", () => {
		// Setup mocks
		const sourceDir = "/source/dir";
		const destDir = "/dest/dir";

		// Mock fs.readdirSync
		(fs.readdirSync as jest.Mock).mockReturnValue([]);

		// Call the function
		const result = realProcessDirectory(sourceDir, destDir);

		// Verify the result
		expect(result.files).toEqual([]);
		expect(result.directories).toEqual([]);
	});
});
