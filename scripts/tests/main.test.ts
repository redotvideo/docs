import fs from "fs";
import path from "path";
import {main} from "../convert";

// Mock dependencies
jest.mock("fs", () => ({
	existsSync: jest.fn(),
	mkdirSync: jest.fn(),
	rmSync: jest.fn(),
	writeFileSync: jest.fn(),
	readFileSync: jest.fn(),
	readdirSync: jest.fn(),
	statSync: jest.fn(),
}));

jest.mock("path", () => ({
	resolve: jest.fn(),
	join: jest.fn(),
	dirname: jest.fn(),
	relative: jest.fn(),
}));

// Mock gray-matter
jest.mock("gray-matter", () => {
	return jest.fn(() => ({
		data: {},
		content: "# Test Content",
	}));
});

// Mock processDirectory function
jest.mock("../convert", () => {
	const originalModule = jest.requireActual("../convert");

	// Create a mock implementation of processDirectory that doesn't call the real one
	const mockProcessDirectory = jest.fn(() => ({
		files: [{name: "file1", position: 1}],
		directories: ["dir1"],
	}));

	return {
		...originalModule,
		processDirectory: mockProcessDirectory,
		// Override the redirects array with a getter/setter to allow tests to modify it
		get redirects() {
			return originalModule.redirects;
		},
		set redirects(value) {
			originalModule.redirects.length = 0;
			originalModule.redirects.push(...value);
		},
	};
});

// Mock console.log
const originalConsoleLog = console.log;
beforeEach(() => {
	console.log = jest.fn();
});
afterEach(() => {
	console.log = originalConsoleLog;
});

describe("main", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Reset the redirects array before each test
		const {redirects} = require("../convert");
		redirects.length = 0;
	});

	it("should run the conversion process", () => {
		// Setup mocks
		const rootDir = "/root";
		const sourceDir = "/root/docs-old/docs";
		const destDir = "/root/src/content";
		const redirectsPath = "/root/redirects.json";

		// Mock path.resolve and path.join
		(path.resolve as jest.Mock).mockReturnValue(rootDir);
		(path.join as jest.Mock).mockImplementation((...args) => args.join("/"));

		// Mock fs.existsSync
		(fs.existsSync as jest.Mock).mockReturnValue(true);

		// Setup redirects
		const {redirects} = require("../convert");
		redirects.push({source: "/old-path", destination: "/new-path", permanent: true});

		// Call the function
		const result = main();

		// Verify the destination directory was prepared
		expect(fs.rmSync).toHaveBeenCalledWith(destDir, {recursive: true, force: true});
		expect(fs.mkdirSync).toHaveBeenCalledWith(destDir, {recursive: true});

		// Verify redirects were written
		expect(fs.writeFileSync).toHaveBeenCalledWith(redirectsPath, expect.any(String));

		// Verify the result contains our redirect
		expect(result).toEqual([{source: "/old-path", destination: "/new-path", permanent: true}]);
	});

	it("should create the destination directory if it does not exist", () => {
		// Setup mocks
		const rootDir = "/root";
		const destDir = "/root/src/content";

		// Mock path.resolve and path.join
		(path.resolve as jest.Mock).mockReturnValue(rootDir);
		(path.join as jest.Mock).mockImplementation((...args) => args.join("/"));

		// Mock fs.existsSync to return false
		(fs.existsSync as jest.Mock).mockReturnValue(false);

		// Call the function
		main();

		// Verify the destination directory was created
		expect(fs.mkdirSync).toHaveBeenCalledWith(destDir, {recursive: true});
		expect(console.log).toHaveBeenCalledWith(`Created destination directory: ${destDir}`);
	});
});
