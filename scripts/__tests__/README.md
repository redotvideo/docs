# Conversion Script Tests

This directory contains tests for the Docusaurus to Nextra conversion script.

## Running the Tests

To run the tests, execute the following commands from the `scripts` directory:

```bash
npm install  # Install dependencies (only needed once)
npm test     # Run the tests
```

## Test Coverage

The tests cover the following functionality:

1. **Basic Conversion**: Tests that MDX files are properly converted with frontmatter removed
2. **Intro to Index Conversion**: Tests that `intro.mdx` files are renamed to `index.mdx`
3. **Info Block Removal**: Tests that `:::info`, `:::caution`, and other similar blocks are removed
4. **Directory Structure**: Tests that nested directories are properly processed
5. **Sidebar Position**: Tests that files are sorted by `sidebar_position` in the generated `_meta.js` files
6. **Redirects**: Tests that redirects are properly generated from slugs

## Test Structure

The tests use a temporary directory structure created in `__tests__/test-data/` with:

-   `docs-old/`: Mock Docusaurus docs structure
-   `docs-new/`: Output Nextra docs structure

Each test creates sample files in the mock structure, runs the conversion, and then verifies the output.

## Adding New Tests

To add new tests:

1. Add a new test case in `convert.test.ts`
2. Create sample files that represent the scenario you want to test
3. Run the conversion
4. Verify the output matches the expected result
