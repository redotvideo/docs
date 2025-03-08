module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/tests/**/*.test.ts"],
	collectCoverage: true,
	coverageDirectory: "coverage",
	collectCoverageFrom: ["**/*.ts", "!**/node_modules/**", "!**/tests/**"],
};
