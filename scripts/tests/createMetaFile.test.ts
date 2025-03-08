import fs from "fs";
import path from "path";
import {createMetaFile} from "../convert";

// Mock fs module
jest.mock("fs", () => ({
	existsSync: jest.fn(),
	mkdirSync: jest.fn(),
	writeFileSync: jest.fn(),
}));

// Mock console.log
const originalConsoleLog = console.log;
beforeEach(() => {
	console.log = jest.fn();
});
afterEach(() => {
	console.log = originalConsoleLog;
});

describe("createMetaFile", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should create a _meta.js file with the provided items", () => {
		// Mock fs.existsSync to return true
		(fs.existsSync as jest.Mock).mockReturnValue(true);

		const dirPath = "/test/dir";
		const items = ["item1", "item2", "item3"];

		const expectedContent = `export default {
  'item1': '',
  'item2': '',
  'item3': '',
}
`;

		const result = createMetaFile(dirPath, items);

		// Check if writeFileSync was called with the correct arguments
		expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(dirPath, "_meta.js"), expectedContent);

		// Check if the function returns the expected content
		expect(result).toBe(expectedContent);
	});

	it("should create the directory if it does not exist", () => {
		// Mock fs.existsSync to return false
		(fs.existsSync as jest.Mock).mockReturnValue(false);

		const dirPath = "/test/dir";
		const items = ["item1", "item2"];

		createMetaFile(dirPath, items);

		// Check if mkdirSync was called with the correct arguments
		expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, {recursive: true});
		expect(console.log).toHaveBeenCalledWith(`Created directory for meta file: ${dirPath}`);
	});

	it("should handle empty items array", () => {
		// Mock fs.existsSync to return true
		(fs.existsSync as jest.Mock).mockReturnValue(true);

		const dirPath = "/test/dir";
		const items: string[] = [];

		const expectedContent = `export default {

}
`;

		const result = createMetaFile(dirPath, items);

		// Check if writeFileSync was called with the correct arguments
		expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(dirPath, "_meta.js"), expectedContent);

		// Check if the function returns the expected content
		expect(result).toBe(expectedContent);
	});
});
